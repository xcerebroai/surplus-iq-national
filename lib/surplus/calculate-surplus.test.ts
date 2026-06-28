import { test } from "node:test";
import assert from "node:assert/strict";

import { calculateSurplus, type SurplusInput } from "./calculate-surplus";
import {
  SaleType,
  SurplusStatus,
  VerificationStatus,
  EvidenceLevel,
} from "../../types/enums";

/** Build a fully-null input, then override the fields a test cares about. */
function input(overrides: Partial<SurplusInput>): SurplusInput {
  return {
    sale_type: SaleType.TaxSale,
    sale_price: null,
    opening_bid: null,
    judgment_amount: null,
    amount_owed: null,
    state: null,
    county: null,
    source_type: null,
    verified_surplus_amount: null,
    ...overrides,
  };
}

test("verified county-list amount is used with highest confidence (Level 4, verified)", () => {
  const r = calculateSurplus(
    input({
      sale_type: SaleType.TaxDeed,
      verified_surplus_amount: 162200,
      source_type: "county_surplus_list",
      state: "FL",
    }),
  );
  assert.equal(r.estimated_surplus_amount, 162200);
  assert.equal(r.surplus_status, SurplusStatus.ConfirmedPublicList);
  assert.equal(r.verification_status, VerificationStatus.Verified);
  assert.equal(r.evidence_level, EvidenceLevel.Level4);
  assert.ok(r.confidence_score >= 0.9);
});

test("sale_price minus amount_owed yields the estimate (tax sale)", () => {
  const r = calculateSurplus(
    input({ sale_type: SaleType.TaxSale, sale_price: 88000, amount_owed: 27000, state: "GA" }),
  );
  assert.equal(r.estimated_surplus_amount, 61000);
  assert.equal(r.surplus_status, SurplusStatus.EstimatedFromSaleData);
  assert.equal(r.verification_status, VerificationStatus.Estimated);
  assert.equal(r.evidence_level, EvidenceLevel.Level3);
});

test("mortgage foreclosure with only an opening bid does NOT confirm surplus (possible_pending_docket)", () => {
  const r = calculateSurplus(
    input({ sale_type: SaleType.MortgageForeclosure, opening_bid: 100, sale_price: null, state: "FL" }),
  );
  assert.equal(r.estimated_surplus_amount, null);
  assert.equal(r.surplus_status, SurplusStatus.PossiblePendingDocket);
  assert.equal(r.verification_status, VerificationStatus.NeedsReview);
  assert.notEqual(r.verification_status, VerificationStatus.Verified);
});

test("Ohio with only an opening bid does NOT calculate confirmed surplus (possible_pending_county_review)", () => {
  const r = calculateSurplus(
    input({ sale_type: SaleType.SheriffSale, opening_bid: 90000, state: "OH" }),
  );
  assert.equal(r.estimated_surplus_amount, null);
  assert.equal(r.surplus_status, SurplusStatus.PossiblePendingCountyReview);
  assert.equal(r.verification_status, VerificationStatus.NeedsReview);
  assert.match(r.warning_message ?? "", /Ohio/);
});

test("Ohio opening-bid rule fires even when a sale price is present but no debt", () => {
  // SPEC: opening bid may be tied to appraised value; without debt we cannot
  // confirm surplus regardless of the hammer price.
  const r = calculateSurplus(
    input({ sale_type: SaleType.SheriffSale, opening_bid: 90000, sale_price: 130000, state: "OH" }),
  );
  assert.equal(r.estimated_surplus_amount, null);
  assert.equal(r.surplus_status, SurplusStatus.PossiblePendingCountyReview);
});

test("Florida tax deed with sale data is estimated but never auto-verified", () => {
  const r = calculateSurplus(
    input({ sale_type: SaleType.TaxDeed, sale_price: 95000, amount_owed: 31000, state: "FL" }),
  );
  assert.equal(r.estimated_surplus_amount, 64000);
  assert.equal(r.verification_status, VerificationStatus.Estimated);
  assert.notEqual(r.verification_status, VerificationStatus.Verified);
  assert.match(r.warning_message ?? "", /Florida tax deed/);
});

test("Florida mortgage foreclosure is handled separately from tax deed (docket review)", () => {
  const r = calculateSurplus(
    input({ sale_type: SaleType.MortgageForeclosure, opening_bid: 100, state: "FL" }),
  );
  assert.equal(r.surplus_status, SurplusStatus.PossiblePendingDocket);
});

test("foreclosure with sale price and debt estimates but requires docket review (not verified)", () => {
  const r = calculateSurplus(
    input({ sale_type: SaleType.MortgageForeclosure, sale_price: 250000, judgment_amount: 182350, state: "FL" }),
  );
  assert.equal(r.estimated_surplus_amount, 67650);
  assert.equal(r.surplus_status, SurplusStatus.PossiblePendingDocket);
  assert.equal(r.verification_status, VerificationStatus.NeedsReview);
  assert.equal(r.evidence_level, EvidenceLevel.Level3);
});

test("result of zero or less is invalid/rejected", () => {
  const r = calculateSurplus(
    input({ sale_type: SaleType.TaxForeclosure, sale_price: 48000, amount_owed: 51500, state: "TX" }),
  );
  assert.equal(r.estimated_surplus_amount, -3500);
  assert.equal(r.surplus_status, SurplusStatus.Invalid);
  assert.equal(r.verification_status, VerificationStatus.Rejected);
});

test("a confirmed county figure that is non-positive is also invalid", () => {
  const r = calculateSurplus(
    input({ sale_type: SaleType.TaxSale, verified_surplus_amount: 0, source_type: "county_surplus_list" }),
  );
  assert.equal(r.surplus_status, SurplusStatus.Invalid);
  assert.equal(r.verification_status, VerificationStatus.Rejected);
});

test("incomplete inputs are flagged needs_review, not estimated", () => {
  const r = calculateSurplus(
    input({ sale_type: SaleType.TaxSale, sale_price: 120000 /* no debt */, state: "GA" }),
  );
  assert.equal(r.estimated_surplus_amount, null);
  assert.equal(r.verification_status, VerificationStatus.NeedsReview);
});

test("no data at all is raw-record-only (Level 1, unknown)", () => {
  const r = calculateSurplus(input({ sale_type: SaleType.TaxSale }));
  assert.equal(r.evidence_level, EvidenceLevel.Level1);
  assert.equal(r.surplus_status, SurplusStatus.Unknown);
});

test("Level 4/5 gate: only verified-amount path yields verification_status=verified", () => {
  const estimated = calculateSurplus(
    input({ sale_type: SaleType.TaxSale, sale_price: 100000, amount_owed: 40000 }),
  );
  // Estimated (Level 3) must never be verified.
  assert.equal(estimated.evidence_level, EvidenceLevel.Level3);
  assert.notEqual(estimated.verification_status, VerificationStatus.Verified);

  const verified = calculateSurplus(
    input({ sale_type: SaleType.TaxSale, verified_surplus_amount: 50000, source_type: "county_surplus_list" }),
  );
  assert.equal(verified.verification_status, VerificationStatus.Verified);
  assert.ok(
    verified.evidence_level === EvidenceLevel.Level4 ||
      verified.evidence_level === EvidenceLevel.Level5,
  );
});
