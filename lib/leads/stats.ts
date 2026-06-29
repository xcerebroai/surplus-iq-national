/**
 * KPI computation over a set of leads. Pure and state-agnostic — works on
 * whatever leads are passed in (typically the currently-filtered set), so the
 * dashboard cards stay responsive to filters. No hardcoded states/values.
 */

import type { JsonLead } from "../../types/json";
import { VerificationStatus, EvidenceLevel } from "../../types/enums";

export interface LeadStats {
  total: number;
  verified: number;
  needsReview: number;
  /** Sum of each lead's best-known surplus (estimated, else verified). */
  estimatedTotalSurplus: number;
  /** The single lead with the largest best-known surplus, if any. */
  highestSurplus: { amount: number; lead: JsonLead } | null;
  /** Leads at evidence Level 4 or Level 5. */
  level4Plus: number;
}

/** A lead's best-known surplus figure: estimated, falling back to verified. */
export function effectiveSurplus(lead: JsonLead): number | null {
  if (lead.estimated_surplus_amount != null) return lead.estimated_surplus_amount;
  if (lead.verified_surplus_amount != null) return lead.verified_surplus_amount;
  return null;
}

export function computeLeadStats(leads: JsonLead[]): LeadStats {
  let verified = 0;
  let needsReview = 0;
  let level4Plus = 0;
  let estimatedTotalSurplus = 0;
  let highestSurplus: { amount: number; lead: JsonLead } | null = null;

  for (const lead of leads) {
    if (lead.verification_status === VerificationStatus.Verified) verified++;
    if (lead.verification_status === VerificationStatus.NeedsReview) needsReview++;
    if (
      lead.evidence_level === EvidenceLevel.Level4 ||
      lead.evidence_level === EvidenceLevel.Level5
    ) {
      level4Plus++;
    }

    const surplus = effectiveSurplus(lead);
    if (surplus != null && surplus > 0) {
      estimatedTotalSurplus += surplus;
      if (!highestSurplus || surplus > highestSurplus.amount) {
        highestSurplus = { amount: surplus, lead };
      }
    }
  }

  return {
    total: leads.length,
    verified,
    needsReview,
    estimatedTotalSurplus,
    highestSurplus,
    level4Plus,
  };
}

/** Best display name for a lead (business, else person, else raw, else id). */
export function leadDisplayName(lead: JsonLead): string {
  return (
    lead.business_name ||
    [lead.first_name, lead.last_name].filter(Boolean).join(" ") ||
    lead.owner_raw_name ||
    lead.id
  );
}
