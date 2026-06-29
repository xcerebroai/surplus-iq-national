/**
 * Client-side lead filtering. Pure functions over the loaded leads.json — no
 * persistence, no backend. State-agnostic: state/county option lists are
 * derived from whatever data is present.
 */

import type { JsonLead } from "../../types/json";
import { VerificationStatus } from "../../types/enums";

export interface LeadFilters {
  /** Free-text search across owner/business/address/city/state/county/case. */
  search: string;
  state: string;
  county: string;
  leadType: string;
  saleType: string;
  surplusStatus: string;
  verificationStatus: string;
  evidenceLevel: string;
  minSurplus: number | null;
  maxSurplus: number | null;
  /** Only verification_status === "verified" (Level 4/5 per helper logic). */
  verifiedOnly: boolean;
}

export const DEFAULT_FILTERS: LeadFilters = {
  search: "",
  state: "",
  county: "",
  leadType: "",
  saleType: "",
  surplusStatus: "",
  verificationStatus: "",
  evidenceLevel: "",
  minSurplus: null,
  maxSurplus: null,
  verifiedOnly: false,
};

/** Fields searched by the free-text box. */
function searchableText(lead: JsonLead): string {
  return [
    lead.owner_raw_name,
    lead.business_name,
    lead.first_name,
    lead.last_name,
    lead.property_address,
    lead.property_city,
    lead.property_state,
    lead.county,
    lead.state,
    lead.case_number,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function applyFilters(leads: JsonLead[], f: LeadFilters): JsonLead[] {
  const search = f.search.trim().toLowerCase();

  return leads.filter((lead) => {
    if (search && !searchableText(lead).includes(search)) return false;
    if (f.state && lead.state !== f.state) return false;
    if (f.county && lead.county !== f.county) return false;
    if (f.leadType && lead.lead_type !== f.leadType) return false;
    if (f.saleType && lead.sale_type !== f.saleType) return false;
    if (f.surplusStatus && lead.surplus_status !== f.surplusStatus) return false;
    if (f.verificationStatus && lead.verification_status !== f.verificationStatus)
      return false;
    if (f.evidenceLevel && lead.evidence_level !== f.evidenceLevel) return false;

    if (f.verifiedOnly && lead.verification_status !== VerificationStatus.Verified)
      return false;

    // Surplus range filters require a known estimate to qualify.
    if (f.minSurplus != null) {
      if (lead.estimated_surplus_amount == null) return false;
      if (lead.estimated_surplus_amount < f.minSurplus) return false;
    }
    if (f.maxSurplus != null) {
      if (lead.estimated_surplus_amount == null) return false;
      if (lead.estimated_surplus_amount > f.maxSurplus) return false;
    }

    return true;
  });
}

/** Sorted unique non-empty states present in the data. */
export function deriveStates(leads: JsonLead[]): string[] {
  const set = new Set<string>();
  for (const l of leads) if (l.state) set.add(l.state);
  return [...set].sort();
}

/**
 * Sorted unique counties present in the data. When a state is selected, only
 * counties within that state are returned (responsive to the state filter).
 */
export function deriveCounties(leads: JsonLead[], state: string): string[] {
  const set = new Set<string>();
  for (const l of leads) {
    if (state && l.state !== state) continue;
    if (l.county) set.add(l.county);
  }
  return [...set].sort();
}

/** Number of active (non-default) filters — used to show/clear filter state. */
export function countActiveFilters(f: LeadFilters): number {
  let n = 0;
  if (f.search.trim()) n++;
  if (f.state) n++;
  if (f.county) n++;
  if (f.leadType) n++;
  if (f.saleType) n++;
  if (f.surplusStatus) n++;
  if (f.verificationStatus) n++;
  if (f.evidenceLevel) n++;
  if (f.minSurplus != null) n++;
  if (f.maxSurplus != null) n++;
  if (f.verifiedOnly) n++;
  return n;
}
