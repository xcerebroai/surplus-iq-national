/**
 * Lead verification helper — STUB (pass-through).
 *
 * The real implementation (next task) will set verification_status from the
 * evidence_level and surplus_status per SPEC ("only Level 4 and Level 5 can be
 * marked verified; everything else is estimated or needs_review"), flag stale
 * sources, missing source URLs, low-confidence owner parsing, etc.
 *
 * For now it is a pass-through so the build pipeline is wired end to end.
 */

import type { JsonLead } from "../../types/json";

/**
 * STUB: returns the lead unchanged. Real version will reconcile
 * verification_status with evidence_level and surplus_status.
 */
export function applyVerification(lead: JsonLead): JsonLead {
  return lead;
}
