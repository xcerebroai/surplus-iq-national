import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { computeLeadStats, effectiveSurplus, leadDisplayName } from "./stats";
import type { JsonLead } from "../../types/json";

const SEED_DIR = join(dirname(fileURLToPath(import.meta.url)), "../../data/sample");
const LEADS: JsonLead[] = readdirSync(SEED_DIR)
  .filter((f) => f.endsWith(".json"))
  .flatMap((f) => JSON.parse(readFileSync(join(SEED_DIR, f), "utf8")) as JsonLead[]);

test("total reflects the input set", () => {
  assert.equal(computeLeadStats(LEADS).total, 21);
  assert.equal(computeLeadStats([]).total, 0);
});

test("verified and needsReview counts match the data", () => {
  const s = computeLeadStats(LEADS);
  assert.equal(s.verified, LEADS.filter((l) => l.verification_status === "verified").length);
  assert.equal(s.needsReview, LEADS.filter((l) => l.verification_status === "needs_review").length);
  assert.ok(s.verified > 0 && s.needsReview > 0);
});

test("level4Plus counts L4 and L5 only", () => {
  const s = computeLeadStats(LEADS);
  const expected = LEADS.filter((l) => l.evidence_level === "level_4" || l.evidence_level === "level_5").length;
  assert.equal(s.level4Plus, expected);
});

test("estimatedTotalSurplus sums positive effective surplus", () => {
  const s = computeLeadStats(LEADS);
  const manual = LEADS.reduce((acc, l) => {
    const v = effectiveSurplus(l);
    return acc + (v != null && v > 0 ? v : 0);
  }, 0);
  assert.equal(s.estimatedTotalSurplus, manual);
  assert.ok(s.estimatedTotalSurplus > 0);
});

test("highestSurplus picks the max effective surplus lead", () => {
  const s = computeLeadStats(LEADS);
  assert.ok(s.highestSurplus);
  const max = Math.max(...LEADS.map((l) => effectiveSurplus(l) ?? 0));
  assert.equal(s.highestSurplus!.amount, max);
});

test("effectiveSurplus falls back estimated -> verified -> null", () => {
  const base = LEADS[0];
  assert.equal(effectiveSurplus({ ...base, estimated_surplus_amount: 5, verified_surplus_amount: 9 }), 5);
  assert.equal(effectiveSurplus({ ...base, estimated_surplus_amount: null, verified_surplus_amount: 9 }), 9);
  assert.equal(effectiveSurplus({ ...base, estimated_surplus_amount: null, verified_surplus_amount: null }), null);
});

test("empty set has null highest and zero totals", () => {
  const s = computeLeadStats([]);
  assert.equal(s.highestSurplus, null);
  assert.equal(s.estimatedTotalSurplus, 0);
  assert.equal(s.verified, 0);
});

test("leadDisplayName prefers business, then person, then raw", () => {
  const base = LEADS[0];
  assert.equal(leadDisplayName({ ...base, business_name: "Acme LLC" }), "Acme LLC");
  assert.equal(
    leadDisplayName({ ...base, business_name: null, first_name: "Jane", last_name: "Doe" }),
    "Jane Doe",
  );
  assert.equal(
    leadDisplayName({ ...base, business_name: null, first_name: null, last_name: null, owner_raw_name: "RAW NAME" }),
    "RAW NAME",
  );
});
