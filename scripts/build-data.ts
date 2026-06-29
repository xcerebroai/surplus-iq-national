/**
 * Surplus IQ — data build script.
 *
 * Reads every seed file in data/sample/ (no hardcoded state list — anything
 * that appears is included), validates each record against the canonical Lead
 * shape (types/models.ts, serialized as JsonLead), runs it through the surplus
 * + verification helpers (currently pass-through stubs), and writes the single
 * artifact the static dashboard loads at runtime: public/data/leads.json.
 *
 * Run: `npm run build:data` (also runs automatically before `next build`).
 *
 * Imports are relative (not the "@/*" alias) so this runs cleanly under tsx /
 * plain Node without tsconfig path resolution.
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  LeadType,
  SaleType,
  SurplusStatus,
  VerificationStatus,
  EvidenceLevel,
  OwnerType,
} from "../types/enums";
import type { JsonLead, LeadsDataset } from "../types/json";
import { processLead } from "../lib/leads/process-lead";
import { ingestSourcesDir } from "../lib/imports/ingest-list";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SEED_DIR = join(ROOT, "data", "sample");
const SOURCES_DIR = join(ROOT, "data", "sources");
const OUT_DIR = join(ROOT, "public", "data");
const OUT_FILE = join(OUT_DIR, "leads.json");

// ---------------------------------------------------------------------------
// Field validation spec — every key in JsonLead with its allowed kind. Keeps
// the seed data honest: a missing field, wrong type, or bad enum value fails
// the build loudly instead of shipping a malformed leads.json.
// ---------------------------------------------------------------------------

type FieldKind =
  | { kind: "string" }
  | { kind: "string|null" }
  | { kind: "number|null" }
  | { kind: "date" } // required ISO string
  | { kind: "date|null" } // ISO string or null
  | { kind: "string[]" }
  | { kind: "enum"; values: readonly string[] };

const FIELD_SPEC: Record<keyof JsonLead, FieldKind> = {
  id: { kind: "string" },
  lead_type: { kind: "enum", values: Object.values(LeadType) },
  sale_type: { kind: "enum", values: Object.values(SaleType) },
  surplus_status: { kind: "enum", values: Object.values(SurplusStatus) },
  verification_status: { kind: "enum", values: Object.values(VerificationStatus) },
  evidence_level: { kind: "enum", values: Object.values(EvidenceLevel) },
  business_name: { kind: "string|null" },
  first_name: { kind: "string|null" },
  last_name: { kind: "string|null" },
  owner_raw_name: { kind: "string|null" },
  owner_type: { kind: "enum", values: Object.values(OwnerType) },
  property_address: { kind: "string|null" },
  property_city: { kind: "string|null" },
  property_state: { kind: "string|null" },
  property_zip: { kind: "string|null" },
  county: { kind: "string|null" },
  state: { kind: "string|null" },
  parcel_number: { kind: "string|null" },
  case_number: { kind: "string|null" },
  court_name: { kind: "string|null" },
  sale_date: { kind: "date|null" },
  sale_price: { kind: "number|null" },
  opening_bid: { kind: "number|null" },
  judgment_amount: { kind: "number|null" },
  amount_owed: { kind: "number|null" },
  estimated_surplus_amount: { kind: "number|null" },
  verified_surplus_amount: { kind: "number|null" },
  source_name: { kind: "string|null" },
  source_type: { kind: "string|null" },
  source_url: { kind: "string|null" },
  source_document_url: { kind: "string|null" },
  source_file_name: { kind: "string|null" },
  source_last_updated: { kind: "date|null" },
  last_checked_at: { kind: "date|null" },
  created_at: { kind: "date" },
  updated_at: { kind: "date" },
  review_status: { kind: "string|null" },
  notes: { kind: "string|null" },
  tags: { kind: "string[]" },
  confidence_score: { kind: "number|null" },
  reject_reason: { kind: "string|null" },
};

const EXPECTED_KEYS = Object.keys(FIELD_SPEC) as (keyof JsonLead)[];

function isIsoDateString(v: unknown): boolean {
  return typeof v === "string" && v.length > 0 && !Number.isNaN(Date.parse(v));
}

function checkField(value: unknown, spec: FieldKind): string | null {
  switch (spec.kind) {
    case "string":
      return typeof value === "string" ? null : "expected string";
    case "string|null":
      return value === null || typeof value === "string"
        ? null
        : "expected string or null";
    case "number|null":
      return value === null || (typeof value === "number" && Number.isFinite(value))
        ? null
        : "expected finite number or null";
    case "date":
      return isIsoDateString(value) ? null : "expected ISO date string";
    case "date|null":
      return value === null || isIsoDateString(value)
        ? null
        : "expected ISO date string or null";
    case "string[]":
      return Array.isArray(value) && value.every((t) => typeof t === "string")
        ? null
        : "expected string[]";
    case "enum":
      return typeof value === "string" && spec.values.includes(value)
        ? null
        : `expected one of: ${spec.values.join(", ")}`;
  }
}

function validateRecord(rec: unknown, file: string, index: number): JsonLead {
  const where = `${file}[${index}]`;
  if (typeof rec !== "object" || rec === null || Array.isArray(rec)) {
    throw new Error(`${where}: record must be a JSON object`);
  }
  const obj = rec as Record<string, unknown>;

  const extra = Object.keys(obj).filter(
    (k) => !EXPECTED_KEYS.includes(k as keyof JsonLead),
  );
  if (extra.length > 0) {
    throw new Error(`${where}: unexpected field(s): ${extra.join(", ")}`);
  }

  for (const key of EXPECTED_KEYS) {
    if (!(key in obj)) {
      throw new Error(`${where}: missing required field "${key}"`);
    }
    const problem = checkField(obj[key], FIELD_SPEC[key]);
    if (problem) {
      throw new Error(
        `${where}: field "${key}" ${problem}, got ${JSON.stringify(obj[key])}`,
      );
    }
  }

  return obj as JsonLead;
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

function build(): void {
  const files = readdirSync(SEED_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();

  if (files.length === 0) {
    throw new Error(`No seed JSON files found in ${SEED_DIR}`);
  }

  const now = new Date().toISOString();
  const seen = new Set<string>();
  const leads: JsonLead[] = [];
  let warningCount = 0;

  for (const file of files) {
    const raw = readFileSync(join(SEED_DIR, file), "utf8");
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      throw new Error(`${file}: invalid JSON — ${(err as Error).message}`);
    }
    if (!Array.isArray(parsed)) {
      throw new Error(`${file}: top-level value must be an array of leads`);
    }

    parsed.forEach((rec, i) => {
      const validated = validateRecord(rec, file, i);
      if (seen.has(validated.id)) {
        throw new Error(`${file}[${i}]: duplicate lead id "${validated.id}"`);
      }
      seen.add(validated.id);

      // Run through the REAL helpers (owner parser + surplus calculator).
      const { lead, warning } = processLead(validated);
      if (warning) warningCount++;

      // The processed record must still conform exactly to the Lead shape.
      validateRecord(lead, `${file} (processed)`, i);

      leads.push(lead);
    });
  }

  // ---- Public-list ingestion (data/sources/*.csv|xlsx + <name>.map.json) ----
  const { leads: importedLeads, results } = ingestSourcesDir(SOURCES_DIR, { now });
  let importedCount = 0;
  let skippedCount = 0;

  for (const result of results) {
    if (result.error) {
      console.warn(`[build-data] source "${result.file}" skipped: ${result.error}`);
      continue;
    }
    skippedCount += result.skipped.length;
    console.log(
      `[build-data] source "${result.file}" (${result.source_name}): ` +
        `${result.imported} imported, ${result.skipped.length} skipped`,
    );
    for (const row of result.skipped) {
      console.warn(`[build-data]   - row ${row.row} skipped: ${row.reason}`);
    }
  }

  for (const lead of importedLeads) {
    if (seen.has(lead.id)) {
      throw new Error(`imported duplicate lead id "${lead.id}" (check id_prefix uniqueness)`);
    }
    seen.add(lead.id);
    // Imported leads are already processed; validate shape before collecting.
    validateRecord(lead, "imported", importedCount);
    leads.push(lead);
    importedCount++;
  }

  // Stable order: state, then county, then id — deterministic output.
  leads.sort(
    (a, b) =>
      (a.state ?? "").localeCompare(b.state ?? "") ||
      (a.county ?? "").localeCompare(b.county ?? "") ||
      a.id.localeCompare(b.id),
  );

  const dataset: LeadsDataset = {
    generatedAt: now,
    count: leads.length,
    leads,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(dataset, null, 2) + "\n", "utf8");

  const states = [...new Set(leads.map((l) => l.state).filter(Boolean))].sort();
  const counties = new Set(leads.map((l) => l.county).filter(Boolean));
  console.log(
    `[build-data] ${leads.length} leads total ` +
      `(${leads.length - importedCount} seed + ${importedCount} imported, ${skippedCount} rows skipped) ` +
      `-> public/data/leads.json`,
  );
  console.log(`[build-data] ${states.length} states, ${counties.size} counties present`);
  console.log(`[build-data] states present: ${states.join(", ") || "(none)"}`);
  console.log(`[build-data] ${warningCount} seed record(s) carry a surplus warning_message`);
}

build();
