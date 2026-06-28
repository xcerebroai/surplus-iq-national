/**
 * Surplus IQ — JSON-serialized record shapes.
 *
 * `Lead` (types/models.ts) is the canonical in-memory shape and uses `Date`
 * for date columns. JSON cannot hold `Date`, so on disk those fields are ISO
 * strings. `JsonLead` derives that serialized shape from `Lead` automatically,
 * so the seed files and `public/data/leads.json` stay in lockstep with the
 * canonical type without rewriting it.
 *
 * This file is additive — it does not modify enums.ts or models.ts.
 */

import type { Lead } from "./models";

/**
 * Replace `Date` with its JSON serialization (ISO string). The conditional is
 * distributive over naked type parameters, so unions like `Date | null` map to
 * `string | null` while non-date types pass through unchanged.
 */
type Serialized<V> = V extends Date ? string : V;

/** `Lead` exactly as it appears in JSON: identical fields, `Date` -> ISO string. */
export type JsonLead = { [K in keyof Lead]: Serialized<Lead[K]> };

/**
 * The single artifact the dashboard reads at runtime: `public/data/leads.json`.
 * Produced by `scripts/build-data.ts`.
 */
export interface LeadsDataset {
  /** ISO timestamp of when the build script produced this file. */
  generatedAt: string;
  /** Number of records in {@link leads} (mirrors `leads.length`). */
  count: number;
  /** All leads after surplus + verification processing. */
  leads: JsonLead[];
}
