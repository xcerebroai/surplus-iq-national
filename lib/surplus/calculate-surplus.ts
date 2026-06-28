/**
 * Surplus calculation helper — STUB (pass-through).
 *
 * The real implementation (next task) will compute estimated_surplus_amount,
 * surplus_status, evidence_level, verification_status, confidence_score, and a
 * warning_message from the sale figures, applying the SPEC rules (mortgage vs.
 * tax deed, Ohio/Florida specifics, "no proof, no confirmed surplus", etc.).
 *
 * For now it is a pass-through so the build pipeline is wired end to end: the
 * record's existing surplus fields are returned unchanged.
 */

import type { JsonLead } from "../../types/json";

/**
 * STUB: returns the lead unchanged. Real version will derive surplus/status
 * fields from sale_price, opening_bid, judgment_amount, amount_owed, state,
 * county, sale_type, and source_type.
 */
export function applySurplusCalculation(lead: JsonLead): JsonLead {
  return lead;
}
