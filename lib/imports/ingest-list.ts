/**
 * Generic public-list ingester (build-time only).
 *
 * Reads any CSV/XLSX file dropped in data/sources/, maps its columns to the
 * Lead schema via a sibling <name>.map.json config, runs each row through the
 * EXISTING owner parser + surplus/verification helpers (via processLead), and
 * returns processed leads tagged with their source. Messy real-world data is
 * tolerated: missing columns, blank cells, "$1,234.00"/"(123)" money strings,
 * mixed-case or padded headers. Rows it can't use are skipped and reported
 * rather than crashing the build.
 *
 * This module changes no helper logic — it only normalizes input and delegates.
 */

import { readdirSync, existsSync, readFileSync } from "node:fs";
import { join, basename } from "node:path";

import type { JsonLead } from "../../types/json";
import {
  LeadType,
  SaleType,
  SurplusStatus,
  VerificationStatus,
  EvidenceLevel,
  OwnerType,
} from "../../types/enums";
import { processLead } from "../leads/process-lead";
import { readTable } from "./parse-csv";

/** Lead fields a mapping config may target. Unknown map keys are ignored. */
export const MAPPABLE_FIELDS = [
  "owner_raw_name",
  "business_name",
  "first_name",
  "last_name",
  "property_address",
  "property_city",
  "property_state",
  "property_zip",
  "county",
  "state",
  "parcel_number",
  "case_number",
  "court_name",
  "sale_date",
  "sale_price",
  "opening_bid",
  "judgment_amount",
  "amount_owed",
  "estimated_surplus_amount",
  "verified_surplus_amount",
  "source_url",
  "source_document_url",
  "last_checked_at",
] as const;
export type MappableField = (typeof MAPPABLE_FIELDS)[number];

const MONEY_FIELDS = new Set<MappableField>([
  "sale_price",
  "opening_bid",
  "judgment_amount",
  "amount_owed",
  "estimated_surplus_amount",
  "verified_surplus_amount",
]);
const DATE_FIELDS = new Set<MappableField>(["sale_date", "last_checked_at"]);

export interface ListMapping {
  source_name: string;
  source_state?: string | null;
  source_county?: string | null;
  source_type?: string | null;
  source_url?: string | null;
  lead_type: string;
  sale_type: string;
  /** Unique id prefix for generated lead ids, e.g. "az-maricopa-td". */
  id_prefix: string;
  /** Map of Lead field -> source column header. */
  columns: Partial<Record<MappableField, string>>;
}

export interface SkippedRow {
  /** 1-based source row number (accounts for the header row). */
  row: number;
  reason: string;
}

export interface SourceResult {
  file: string;
  mapFile: string;
  source_name?: string;
  imported: number;
  skipped: SkippedRow[];
  /** Set if the whole source failed (bad/missing map, unreadable file). */
  error?: string;
}

export interface IngestOptions {
  /** ISO timestamp used for created_at/updated_at on imported leads. */
  now: string;
  /** Original data file name, stored as source_file_name. */
  fileName?: string;
}

// --- Value coercion -------------------------------------------------------

const NULLISH = /^(n\/?a|none|null|tbd|unknown|-{1,2})$/i;

export function cleanText(v: string | undefined | null): string | null {
  if (v == null) return null;
  const t = v.trim();
  if (t === "" || NULLISH.test(t)) return null;
  return t;
}

/** Parse a money string: strips $ and commas, supports (123) negatives. */
export function cleanMoney(v: string | undefined | null): number | null {
  if (v == null) return null;
  let t = v.trim();
  if (t === "" || NULLISH.test(t)) return null;
  let negative = false;
  if (/^\(.*\)$/.test(t)) {
    negative = true;
    t = t.slice(1, -1);
  }
  if (/^-/.test(t)) {
    negative = true;
    t = t.slice(1);
  }
  t = t.replace(/[$,\s]/g, "");
  if (t === "") return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return negative ? -n : n;
}

/** Parse a date to an ISO string. Handles YYYY-MM-DD and M/D/YYYY (UTC-safe). */
export function cleanDate(v: string | undefined | null): string | null {
  const t = cleanText(v);
  if (!t) return null;
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(t);
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).toISOString();
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/.exec(t);
  if (m) {
    let yr = +m[3];
    if (yr < 100) yr += 2000;
    return new Date(Date.UTC(yr, +m[1] - 1, +m[2])).toISOString();
  }
  const ts = Date.parse(t);
  return Number.isNaN(ts) ? null : new Date(ts).toISOString();
}

export function cleanState(v: string | undefined | null): string | null {
  const t = cleanText(v);
  return t ? t.toUpperCase() : null;
}

// --- Mapping validation ---------------------------------------------------

export function validateMapping(raw: unknown): ListMapping {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("mapping must be a JSON object");
  }
  const map = raw as Record<string, unknown>;
  if (typeof map.source_name !== "string" || map.source_name.trim() === "") {
    throw new Error("mapping.source_name is required");
  }
  if (typeof map.id_prefix !== "string" || map.id_prefix.trim() === "") {
    throw new Error("mapping.id_prefix is required");
  }
  if (!Object.values(LeadType).includes(map.lead_type as LeadType)) {
    throw new Error(`mapping.lead_type invalid: ${JSON.stringify(map.lead_type)}`);
  }
  if (!Object.values(SaleType).includes(map.sale_type as SaleType)) {
    throw new Error(`mapping.sale_type invalid: ${JSON.stringify(map.sale_type)}`);
  }
  if (!map.columns || typeof map.columns !== "object") {
    throw new Error("mapping.columns is required");
  }
  return map as unknown as ListMapping;
}

// --- Ingestion ------------------------------------------------------------

const normalizeHeader = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * Map and process a set of already-parsed rows. Pure (no filesystem) so it is
 * easily testable with in-memory data.
 */
export function ingestRows(
  rows: Record<string, string>[],
  map: ListMapping,
  opts: IngestOptions,
): { leads: JsonLead[]; skipped: SkippedRow[] } {
  const leads: JsonLead[] = [];
  const skipped: SkippedRow[] = [];

  // Precompute normalized header -> mapped field is not needed; instead build a
  // normalized lookup per row so header case/spacing differences are tolerated.
  rows.forEach((row, idx) => {
    const rowNumber = idx + 2; // 1-based + header row
    try {
      const norm = new Map<string, string>();
      for (const [k, v] of Object.entries(row)) norm.set(normalizeHeader(k), v);

      const get = (field: MappableField): string | undefined => {
        const header = map.columns[field];
        if (!header) return undefined;
        return norm.get(normalizeHeader(header));
      };

      // Owner: prefer a single raw-name column; else synthesize from parts.
      let ownerRaw = cleanText(get("owner_raw_name"));
      if (!ownerRaw) {
        const biz = cleanText(get("business_name"));
        const last = cleanText(get("last_name"));
        const first = cleanText(get("first_name"));
        if (biz) ownerRaw = biz;
        else if (last || first) ownerRaw = [last, first].filter(Boolean).join(" ");
      }

      const address = cleanText(get("property_address"));
      if (!ownerRaw && !address) {
        skipped.push({ row: rowNumber, reason: "no owner name or property address" });
        return;
      }

      const state = cleanState(get("state")) ?? cleanState(map.source_state) ?? null;
      const propertyState = cleanState(get("property_state")) ?? state;
      const county = cleanText(get("county")) ?? cleanText(map.source_county) ?? null;

      const raw: JsonLead = {
        id: `${map.id_prefix}-${String(idx + 1).padStart(4, "0")}`,
        lead_type: map.lead_type as LeadType,
        sale_type: map.sale_type as SaleType,
        // Placeholders — overwritten by processLead via the real helpers.
        surplus_status: SurplusStatus.Unknown,
        verification_status: VerificationStatus.NeedsReview,
        evidence_level: EvidenceLevel.Level1,
        business_name: null,
        first_name: null,
        last_name: null,
        owner_raw_name: ownerRaw,
        owner_type: OwnerType.Unknown,
        property_address: address,
        property_city: cleanText(get("property_city")),
        property_state: propertyState,
        property_zip: cleanText(get("property_zip")),
        county,
        state,
        parcel_number: cleanText(get("parcel_number")),
        case_number: cleanText(get("case_number")),
        court_name: cleanText(get("court_name")),
        sale_date: cleanDate(get("sale_date")),
        sale_price: cleanMoney(get("sale_price")),
        opening_bid: cleanMoney(get("opening_bid")),
        judgment_amount: cleanMoney(get("judgment_amount")),
        amount_owed: cleanMoney(get("amount_owed")),
        estimated_surplus_amount: cleanMoney(get("estimated_surplus_amount")),
        verified_surplus_amount: cleanMoney(get("verified_surplus_amount")),
        source_name: map.source_name,
        source_type: cleanText(map.source_type) ?? null,
        source_url: cleanText(get("source_url")) ?? cleanText(map.source_url) ?? null,
        source_document_url: cleanText(get("source_document_url")),
        source_file_name: opts.fileName ?? null,
        source_last_updated: null,
        last_checked_at: cleanDate(get("last_checked_at")),
        created_at: opts.now,
        updated_at: opts.now,
        review_status: null,
        notes: null,
        tags: ["imported", `source:${map.id_prefix}`],
        confidence_score: null,
        reject_reason: null,
      };

      const { lead } = processLead(raw);
      leads.push(lead);
    } catch (err) {
      skipped.push({ row: rowNumber, reason: (err as Error).message });
    }
  });

  return { leads, skipped };
}

/** Read one data file + its mapping and ingest it. */
export function ingestListFile(
  dataPath: string,
  mapPath: string,
  now: string,
): { leads: JsonLead[]; skipped: SkippedRow[]; source_name: string } {
  const map = validateMapping(JSON.parse(readFileSync(mapPath, "utf8")));
  const table = readTable(dataPath);
  const { leads, skipped } = ingestRows(table.rows, map, {
    now,
    fileName: basename(dataPath),
  });
  return { leads, skipped, source_name: map.source_name };
}

/**
 * Ingest every CSV/XLSX in a directory, each paired with <name>.map.json.
 * A failing source (missing/invalid map, unreadable file) is recorded as an
 * error and skipped — it never crashes the build.
 */
export function ingestSourcesDir(
  dir: string,
  opts: { now: string },
): { leads: JsonLead[]; results: SourceResult[] } {
  const results: SourceResult[] = [];
  const leads: JsonLead[] = [];
  if (!existsSync(dir)) return { leads, results };

  const dataFiles = readdirSync(dir)
    .filter((f) => /\.(csv|xlsx|xls)$/i.test(f))
    .sort();

  for (const file of dataFiles) {
    const base = file.replace(/\.[^.]+$/, "");
    const mapFile = `${base}.map.json`;
    const result: SourceResult = { file, mapFile, imported: 0, skipped: [] };
    try {
      const mapPath = join(dir, mapFile);
      if (!existsSync(mapPath)) throw new Error(`missing mapping file ${mapFile}`);
      const out = ingestListFile(join(dir, file), mapPath, opts.now);
      result.source_name = out.source_name;
      result.imported = out.leads.length;
      result.skipped = out.skipped;
      leads.push(...out.leads);
    } catch (err) {
      result.error = (err as Error).message;
    }
    results.push(result);
  }

  return { leads, results };
}

// Re-exported for potential external use / documentation.
export { MONEY_FIELDS, DATE_FIELDS };
