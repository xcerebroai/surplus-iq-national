/**
 * Shared lead-processing wrapper. Runs a record through the existing owner
 * parser and surplus/verification helpers, preserving the source-health and
 * case-lifecycle statuses the calculator cannot derive.
 *
 * Used by BOTH the seed pipeline (scripts/build-data.ts) and the public-list
 * ingester (lib/imports/ingest-list.ts) so every lead — seed or imported — goes
 * through one identical processing path. This file does not change any helper
 * logic; it only orchestrates the existing helpers.
 */

import type { JsonLead } from "../../types/json";
import { SurplusStatus, VerificationStatus, EvidenceLevel } from "../../types/enums";
import { calculateSurplus } from "../surplus/calculate-surplus";
import { parseOwnerName } from "../surplus/owner-parser";

// Statuses the surplus calculator cannot derive from sale/debt figures and must
// not clobber. These come from source health / case lifecycle.
const PRESERVE_VERIFICATION = new Set<string>([
  VerificationStatus.SourceError,
  VerificationStatus.Stale,
]);
const PRESERVE_SURPLUS_STATUS = new Set<string>([
  SurplusStatus.ClaimFiled,
  SurplusStatus.Disbursed,
  SurplusStatus.Expired,
]);

/**
 * Apply the owner parser and surplus calculator to a record.
 * - Owner fields (business_name/first/last/owner_type) are recomputed from
 *   owner_raw_name, which is always preserved.
 * - Surplus/evidence/confidence come from the calculator. surplus_status and
 *   verification_status are taken from the calculator UNLESS the record already
 *   carries a lifecycle/health state the calculator can't model.
 */
export function processLead(lead: JsonLead): { lead: JsonLead; warning: string | null } {
  const owner = parseOwnerName(lead.owner_raw_name);

  const surplus = calculateSurplus({
    sale_type: lead.sale_type,
    sale_price: lead.sale_price,
    opening_bid: lead.opening_bid,
    judgment_amount: lead.judgment_amount,
    amount_owed: lead.amount_owed,
    state: lead.state,
    county: lead.county,
    source_type: lead.source_type,
    verified_surplus_amount: lead.verified_surplus_amount,
  });

  const surplus_status = PRESERVE_SURPLUS_STATUS.has(lead.surplus_status)
    ? lead.surplus_status
    : surplus.surplus_status;
  const verification_status = PRESERVE_VERIFICATION.has(lead.verification_status)
    ? lead.verification_status
    : surplus.verification_status;

  const processed: JsonLead = {
    ...lead,
    business_name: owner.business_name,
    first_name: owner.first_name,
    last_name: owner.last_name,
    owner_type: owner.owner_type,
    // owner_raw_name preserved (spread above keeps it; never overwritten)
    estimated_surplus_amount: surplus.estimated_surplus_amount,
    confidence_score: surplus.confidence_score,
    evidence_level: surplus.evidence_level as EvidenceLevel,
    surplus_status,
    verification_status,
  };

  return { lead: processed, warning: surplus.warning_message };
}
