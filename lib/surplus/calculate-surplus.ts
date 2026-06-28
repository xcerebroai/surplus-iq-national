/**
 * Surplus calculation helper.
 *
 * Implements SPEC.md's surplus logic exactly. Core principle: accuracy over
 * volume — no proof, no confirmed surplus. The function is intentionally
 * conservative; when inputs are insufficient or ambiguous it returns a
 * "needs review"/"possible" status rather than a confident number.
 *
 * sale_type regimes (using the existing SaleType enum as-is):
 *   - Tax regime:        tax_deed, tax_sale, tax_foreclosure
 *   - Foreclosure regime: mortgage_foreclosure, sheriff_sale
 *       (sheriff sale is the judicial-foreclosure auction mechanism; SPEC's
 *        mortgage-foreclosure rules — never rely on opening bid alone, docket
 *        review required — apply to it.)
 *   - "other": no SPEC-defined surplus regime; handled conservatively
 *        (estimate only when sale_price and a debt figure are both present,
 *        and always left as needs_review).
 *
 * Evidence levels: this helper can justify at most Level 4 ("county
 * surplus/excess list confirms funds"), reached only when a verified
 * county-list amount is supplied. Level 5 additionally requires the source to
 * confirm owner/entity identity, which cannot be proven from these inputs
 * alone, so the helper never emits Level 5. The Level 4/5 gate on
 * verification_status=verified is therefore satisfied only via Level 4 here.
 */

import {
  SaleType,
  SurplusStatus,
  VerificationStatus,
  EvidenceLevel,
} from "../../types/enums";

export interface SurplusInput {
  sale_type: SaleType;
  sale_price: number | null;
  opening_bid: number | null;
  judgment_amount: number | null;
  amount_owed: number | null;
  state: string | null;
  county: string | null;
  source_type: string | null;
  /** Confirmed figure from an official county/court list, if any. */
  verified_surplus_amount: number | null;
}

export interface SurplusResult {
  estimated_surplus_amount: number | null;
  /** 0..1 confidence in the surplus determination. */
  confidence_score: number;
  surplus_status: SurplusStatus;
  verification_status: VerificationStatus;
  evidence_level: EvidenceLevel;
  warning_message: string | null;
}

const TAX_SALE_TYPES: readonly SaleType[] = [
  SaleType.TaxDeed,
  SaleType.TaxSale,
  SaleType.TaxForeclosure,
];

const FORECLOSURE_SALE_TYPES: readonly SaleType[] = [
  SaleType.MortgageForeclosure,
  SaleType.SheriffSale,
];

/** Substrings that signal an official county/court list source. */
const OFFICIAL_LIST_MARKERS = [
  "county_surplus_list",
  "court_registry_list",
  "surplus_list",
  "registry",
  "excess",
  "excess_funds",
  "excess_proceeds",
];

function isOfficialListSource(sourceType: string | null): boolean {
  if (!sourceType) return false;
  const s = sourceType.toLowerCase();
  return OFFICIAL_LIST_MARKERS.some((m) => s.includes(m));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function result(
  estimated_surplus_amount: number | null,
  confidence_score: number,
  surplus_status: SurplusStatus,
  verification_status: VerificationStatus,
  evidence_level: EvidenceLevel,
  warning_message: string | null,
): SurplusResult {
  return {
    estimated_surplus_amount,
    confidence_score,
    surplus_status,
    verification_status,
    evidence_level,
    warning_message,
  };
}

export function calculateSurplus(input: SurplusInput): SurplusResult {
  const {
    sale_type,
    sale_price,
    opening_bid,
    judgment_amount,
    amount_owed,
    state,
    source_type,
    verified_surplus_amount,
  } = input;

  const st = (state ?? "").trim().toUpperCase();
  const isOhio = st === "OH";
  const isFlorida = st === "FL";

  const isTax = TAX_SALE_TYPES.includes(sale_type);
  const isForeclosure = FORECLOSURE_SALE_TYPES.includes(sale_type);
  const officialList = isOfficialListSource(source_type);

  const hasSalePrice = sale_price != null;
  const hasOwed = amount_owed != null;
  const hasJudgment = judgment_amount != null;
  const hasOpening = opening_bid != null;

  // Debt used for the estimate: amount_owed primarily; for foreclosures the
  // judgment/decree amount may substitute (SPEC: "sale price and
  // judgment/debt/amount owed"). Tax sales use amount_owed only.
  const debt = hasOwed
    ? amount_owed
    : isForeclosure && hasJudgment
      ? judgment_amount
      : null;
  const hasDebt = debt != null;

  // 1) Verified county-list amount → use it, highest confidence (Level 4 gate).
  if (verified_surplus_amount != null) {
    if (verified_surplus_amount <= 0) {
      return result(
        round2(verified_surplus_amount),
        0.5,
        SurplusStatus.Invalid,
        VerificationStatus.Rejected,
        EvidenceLevel.Level4,
        "Confirmed county figure is zero or negative; no surplus to claim.",
      );
    }
    const warning = officialList
      ? null
      : "Verified surplus amount present but source_type is not a recognized official county/court list; confirm provenance.";
    return result(
      round2(verified_surplus_amount),
      0.98,
      SurplusStatus.ConfirmedPublicList,
      VerificationStatus.Verified,
      EvidenceLevel.Level4,
      warning,
    );
  }

  // 2) Sale price and a debt figure both present → estimate = sale_price - debt.
  if (hasSalePrice && hasDebt) {
    const estimated = round2(sale_price! - debt!);

    if (estimated <= 0) {
      return result(
        estimated,
        0.6,
        SurplusStatus.Invalid,
        VerificationStatus.Rejected,
        EvidenceLevel.Level2,
        "Sale price does not exceed amount owed; no surplus exists.",
      );
    }

    if (isForeclosure) {
      // Mortgage/sheriff foreclosure: estimate is meaningful but docket review
      // is required before the lead is usable (claims, bankruptcy, motions to
      // vacate, third-party surplus claims).
      return result(
        estimated,
        0.55,
        SurplusStatus.PossiblePendingDocket,
        VerificationStatus.NeedsReview,
        EvidenceLevel.Level3,
        "Foreclosure surplus estimated from sale price minus debt; docket review required before use.",
      );
    }

    if (isTax) {
      const warning =
        isFlorida && sale_type === SaleType.TaxDeed
          ? "Florida tax deed: estimated from public sale data; remains estimated until county surplus list confirms."
          : "Estimated from public sale data; remains estimated until a county excess/surplus list confirms.";
      return result(
        estimated,
        0.65,
        SurplusStatus.EstimatedFromSaleData,
        VerificationStatus.Estimated,
        EvidenceLevel.Level3,
        warning,
      );
    }

    // "other" sale type: no SPEC regime — estimate but never auto-trust it.
    return result(
      estimated,
      0.4,
      SurplusStatus.EstimatedFromSaleData,
      VerificationStatus.NeedsReview,
      EvidenceLevel.Level3,
      `Sale type "${sale_type}" has no SPEC-defined surplus regime; estimate computed but flagged for review.`,
    );
  }

  // 3) Ohio with only an opening bid → do NOT calculate confirmed surplus.
  //    Opening bid may reflect 2/3-appraised-value rules, not the debt.
  if (isOhio && hasOpening && !hasOwed && !hasJudgment) {
    return result(
      null,
      0.3,
      SurplusStatus.PossiblePendingCountyReview,
      VerificationStatus.NeedsReview,
      EvidenceLevel.Level2,
      "Ohio: opening bid may reflect appraised-value rules, not the debt. Need judgment/decree/report of sale/confirmation or county excess fund list.",
    );
  }

  // 4) Foreclosure with only an opening bid → possible_pending_docket.
  //    Never rely on opening bid alone for mortgage/sheriff foreclosures.
  if (isForeclosure && hasOpening && !hasOwed && !hasJudgment) {
    return result(
      null,
      0.35,
      SurplusStatus.PossiblePendingDocket,
      VerificationStatus.NeedsReview,
      EvidenceLevel.Level2,
      "Foreclosure: cannot rely on opening bid alone. Need sale price and judgment/debt, plus docket review.",
    );
  }

  // 5) Tax sale/deed with an opening bid but no clear debt → meaning unclear,
  //    do not confirm surplus pending county review.
  if (isTax && hasOpening && !hasOwed) {
    return result(
      null,
      0.35,
      SurplusStatus.PossiblePendingCountyReview,
      VerificationStatus.NeedsReview,
      EvidenceLevel.Level2,
      "Opening bid meaning unclear (may not represent taxes, costs, and fees); do not confirm surplus pending county review.",
    );
  }

  // 6) No sale or debt data at all → raw record only.
  if (!hasSalePrice && !hasOpening && !hasJudgment && !hasOwed) {
    return result(
      null,
      0.15,
      SurplusStatus.Unknown,
      VerificationStatus.NeedsReview,
      EvidenceLevel.Level1,
      "No sale or debt data found; raw record only.",
    );
  }

  // 7) Some data, but insufficient to estimate → incomplete inputs.
  return result(
    null,
    0.3,
    SurplusStatus.Unknown,
    VerificationStatus.NeedsReview,
    EvidenceLevel.Level2,
    "Incomplete inputs: need sale price and a debt figure (amount owed or judgment), or a confirmed county figure.",
  );
}
