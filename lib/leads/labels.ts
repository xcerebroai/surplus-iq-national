/**
 * Human-readable labels and badge tones for enum values. Pure data (no JSX) so
 * it is safe to import anywhere, including build scripts and tests.
 */

import {
  LeadType,
  SaleType,
  SurplusStatus,
  VerificationStatus,
  EvidenceLevel,
  OwnerType,
} from "../../types/enums";

/** Visual tone for badges; maps to color classes in components/ui/badge.tsx. */
export type Tone =
  | "gray"
  | "slate"
  | "blue"
  | "green"
  | "emerald"
  | "amber"
  | "orange"
  | "red"
  | "purple";

export const LEAD_TYPE_LABELS: Record<LeadType, string> = {
  [LeadType.MortgageForeclosureSurplus]: "Mortgage Foreclosure Surplus",
  [LeadType.TaxDeedSurplus]: "Tax Deed Surplus",
  [LeadType.TaxSaleExcessProceeds]: "Tax Sale Excess Proceeds",
  [LeadType.SheriffSaleExcessProceeds]: "Sheriff Sale Excess Proceeds",
  [LeadType.ClerkRegistryFunds]: "Clerk Registry Funds",
  [LeadType.UnclaimedForeclosureFunds]: "Unclaimed Foreclosure Funds",
};

export const SALE_TYPE_LABELS: Record<SaleType, string> = {
  [SaleType.MortgageForeclosure]: "Mortgage Foreclosure",
  [SaleType.TaxDeed]: "Tax Deed",
  [SaleType.TaxSale]: "Tax Sale",
  [SaleType.TaxForeclosure]: "Tax Foreclosure",
  [SaleType.SheriffSale]: "Sheriff Sale",
  [SaleType.Other]: "Other",
};

export const OWNER_TYPE_LABELS: Record<OwnerType, string> = {
  [OwnerType.Individual]: "Individual",
  [OwnerType.Business]: "Business",
  [OwnerType.Trust]: "Trust",
  [OwnerType.Estate]: "Estate",
  [OwnerType.Unknown]: "Unknown",
};

export const SURPLUS_STATUS_LABELS: Record<SurplusStatus, string> = {
  [SurplusStatus.ConfirmedPublicList]: "Confirmed — Public List",
  [SurplusStatus.EstimatedFromSaleData]: "Estimated (Sale Data)",
  [SurplusStatus.PossiblePendingDocket]: "Possible — Pending Docket",
  [SurplusStatus.PossiblePendingCountyReview]: "Possible — County Review",
  [SurplusStatus.ClaimFiled]: "Claim Filed",
  [SurplusStatus.Disbursed]: "Disbursed",
  [SurplusStatus.Expired]: "Expired",
  [SurplusStatus.Invalid]: "Invalid",
  [SurplusStatus.Unknown]: "Unknown",
};

export const SURPLUS_STATUS_TONES: Record<SurplusStatus, Tone> = {
  [SurplusStatus.ConfirmedPublicList]: "green",
  [SurplusStatus.EstimatedFromSaleData]: "blue",
  [SurplusStatus.PossiblePendingDocket]: "amber",
  [SurplusStatus.PossiblePendingCountyReview]: "amber",
  [SurplusStatus.ClaimFiled]: "purple",
  [SurplusStatus.Disbursed]: "slate",
  [SurplusStatus.Expired]: "gray",
  [SurplusStatus.Invalid]: "red",
  [SurplusStatus.Unknown]: "gray",
};

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  [VerificationStatus.Verified]: "Verified",
  [VerificationStatus.Estimated]: "Estimated",
  [VerificationStatus.NeedsReview]: "Needs Review",
  [VerificationStatus.Rejected]: "Rejected",
  [VerificationStatus.Stale]: "Stale",
  [VerificationStatus.SourceError]: "Source Error",
};

export const VERIFICATION_STATUS_TONES: Record<VerificationStatus, Tone> = {
  [VerificationStatus.Verified]: "green",
  [VerificationStatus.Estimated]: "blue",
  [VerificationStatus.NeedsReview]: "amber",
  [VerificationStatus.Rejected]: "red",
  [VerificationStatus.Stale]: "orange",
  [VerificationStatus.SourceError]: "red",
};

export const EVIDENCE_LEVEL_LABELS: Record<EvidenceLevel, string> = {
  [EvidenceLevel.Level1]: "Level 1",
  [EvidenceLevel.Level2]: "Level 2",
  [EvidenceLevel.Level3]: "Level 3",
  [EvidenceLevel.Level4]: "Level 4",
  [EvidenceLevel.Level5]: "Level 5",
};

/** Short pill form, e.g. "L4". */
export const EVIDENCE_LEVEL_SHORT: Record<EvidenceLevel, string> = {
  [EvidenceLevel.Level1]: "L1",
  [EvidenceLevel.Level2]: "L2",
  [EvidenceLevel.Level3]: "L3",
  [EvidenceLevel.Level4]: "L4",
  [EvidenceLevel.Level5]: "L5",
};

export const EVIDENCE_LEVEL_TONES: Record<EvidenceLevel, Tone> = {
  [EvidenceLevel.Level1]: "gray",
  [EvidenceLevel.Level2]: "slate",
  [EvidenceLevel.Level3]: "blue",
  [EvidenceLevel.Level4]: "green",
  [EvidenceLevel.Level5]: "emerald",
};
