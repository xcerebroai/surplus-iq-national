import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  applyFilters,
  deriveStates,
  deriveCounties,
  countActiveFilters,
  DEFAULT_FILTERS,
  type LeadFilters,
} from "./filtering";
import type { JsonLead } from "../../types/json";

// Load the raw seed (21 leads) for deterministic, realistic filter tests.
const SEED_DIR = join(dirname(fileURLToPath(import.meta.url)), "../../data/sample");
const LEADS: JsonLead[] = readdirSync(SEED_DIR)
  .filter((f) => f.endsWith(".json"))
  .flatMap((f) => JSON.parse(readFileSync(join(SEED_DIR, f), "utf8")) as JsonLead[]);

function withFilters(overrides: Partial<LeadFilters>): LeadFilters {
  return { ...DEFAULT_FILTERS, ...overrides };
}

test("seed loads 21 leads", () => {
  assert.equal(LEADS.length, 21);
});

test("no filters returns all leads", () => {
  assert.equal(applyFilters(LEADS, DEFAULT_FILTERS).length, 21);
});

test("deriveStates returns sorted unique states", () => {
  assert.deepEqual(deriveStates(LEADS), ["CA", "FL", "GA", "OH", "TX", "WA"]);
});

test("state filter reduces to that state's leads", () => {
  const fl = applyFilters(LEADS, withFilters({ state: "FL" }));
  assert.equal(fl.length, 6);
  assert.ok(fl.every((l) => l.state === "FL"));
});

test("county options are responsive to selected state", () => {
  const flCounties = deriveCounties(LEADS, "FL");
  assert.ok(flCounties.includes("Miami-Dade"));
  assert.ok(!flCounties.includes("King")); // King is WA, not FL
  // All-counties (no state) is a superset.
  assert.ok(deriveCounties(LEADS, "").length >= flCounties.length);
});

test("search matches owner/business/address/city across fields", () => {
  assert.equal(applyFilters(LEADS, withFilters({ search: "Sunrise" })).length, 1);
  assert.equal(applyFilters(LEADS, withFilters({ search: "atlanta" })).length, 1); // case-insensitive
  assert.ok(applyFilters(LEADS, withFilters({ search: "zzz-no-match" })).length === 0);
});

test("verifiedOnly keeps only verified leads", () => {
  const verified = applyFilters(LEADS, withFilters({ verifiedOnly: true }));
  assert.ok(verified.length > 0 && verified.length < 21);
  assert.ok(verified.every((l) => l.verification_status === "verified"));
});

test("min/max surplus range excludes out-of-range and null estimates", () => {
  const min = applyFilters(LEADS, withFilters({ minSurplus: 100000 }));
  assert.ok(min.length > 0);
  assert.ok(min.every((l) => l.estimated_surplus_amount != null && l.estimated_surplus_amount >= 100000));

  const max = applyFilters(LEADS, withFilters({ maxSurplus: 70000 }));
  assert.ok(max.every((l) => l.estimated_surplus_amount != null && l.estimated_surplus_amount <= 70000));
});

test("filters compose (state + verifiedOnly)", () => {
  const out = applyFilters(LEADS, withFilters({ state: "FL", verifiedOnly: true }));
  assert.ok(out.every((l) => l.state === "FL" && l.verification_status === "verified"));
});

test("countActiveFilters reflects non-default fields", () => {
  assert.equal(countActiveFilters(DEFAULT_FILTERS), 0);
  assert.equal(countActiveFilters(withFilters({ state: "FL", verifiedOnly: true })), 2);
  assert.equal(countActiveFilters(withFilters({ search: "  " })), 0); // blank search not counted
});
