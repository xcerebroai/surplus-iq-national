/**
 * Surplus IQ — shared enums.
 *
 * These mirror the Prisma enums in `prisma/schema.prisma` exactly (same string
 * values), so the app and the database share one definition. If you change an
 * enum here, change it in the schema and run `prisma migrate dev` (and vice
 * versa).
 */

/** SPEC "Lead types". */
export enum LeadType {
  MortgageForeclosureSurplus = "mortgage_foreclosure_surplus",
  TaxDeedSurplus = "tax_deed_surplus",
  TaxSaleExcessProceeds = "tax_sale_excess_proceeds",
  SheriffSaleExcessProceeds = "sheriff_sale_excess_proceeds",
  ClerkRegistryFunds = "clerk_registry_funds",
  UnclaimedForeclosureFunds = "unclaimed_foreclosure_funds",
}

/**
 * Underlying sale mechanism. NOTE: SPEC requires `sale_type` to be an enum but
 * never lists its values — this set is inferred from product scope.
 */
export enum SaleType {
  MortgageForeclosure = "mortgage_foreclosure",
  TaxDeed = "tax_deed",
  TaxSale = "tax_sale",
  TaxForeclosure = "tax_foreclosure",
  SheriffSale = "sheriff_sale",
  Other = "other",
}

/** SPEC "Surplus status enum" (9 values). */
export enum SurplusStatus {
  ConfirmedPublicList = "confirmed_public_list",
  EstimatedFromSaleData = "estimated_from_sale_data",
  PossiblePendingDocket = "possible_pending_docket",
  PossiblePendingCountyReview = "possible_pending_county_review",
  ClaimFiled = "claim_filed",
  Disbursed = "disbursed",
  Expired = "expired",
  Invalid = "invalid",
  Unknown = "unknown",
}

/** SPEC "Verification status enum" (6 values). */
export enum VerificationStatus {
  Verified = "verified",
  Estimated = "estimated",
  NeedsReview = "needs_review",
  Rejected = "rejected",
  Stale = "stale",
  SourceError = "source_error",
}

/**
 * SPEC "Evidence level" 1-5. Prisma enum members can't be numeric, so the
 * canonical values are `level_1`..`level_5`. Only level_4 and level_5 may be
 * marked verified. Use {@link evidenceLevelToNumber} / {@link numberToEvidenceLevel}
 * to convert to/from the 1-5 integer used in the surplus logic.
 */
export enum EvidenceLevel {
  Level1 = "level_1",
  Level2 = "level_2",
  Level3 = "level_3",
  Level4 = "level_4",
  Level5 = "level_5",
}

/** SPEC `owner_type`. */
export enum OwnerType {
  Individual = "individual",
  Business = "business",
  Trust = "trust",
  Estate = "estate",
  Unknown = "unknown",
}

/** SPEC SourceRegistry `data_format`. */
export enum DataFormat {
  Html = "html",
  Pdf = "pdf",
  Csv = "csv",
  Xlsx = "xlsx",
  Json = "json",
  Manual = "manual",
}

/** SPEC SourceRegistry `access_level`. */
export enum AccessLevel {
  Easy = "easy",
  Moderate = "moderate",
  Hard = "hard",
  Blocked = "blocked",
}

// ---------------------------------------------------------------------------
// Evidence level <-> integer helpers
// ---------------------------------------------------------------------------

const EVIDENCE_LEVEL_TO_NUMBER: Record<EvidenceLevel, 1 | 2 | 3 | 4 | 5> = {
  [EvidenceLevel.Level1]: 1,
  [EvidenceLevel.Level2]: 2,
  [EvidenceLevel.Level3]: 3,
  [EvidenceLevel.Level4]: 4,
  [EvidenceLevel.Level5]: 5,
};

const NUMBER_TO_EVIDENCE_LEVEL: Record<1 | 2 | 3 | 4 | 5, EvidenceLevel> = {
  1: EvidenceLevel.Level1,
  2: EvidenceLevel.Level2,
  3: EvidenceLevel.Level3,
  4: EvidenceLevel.Level4,
  5: EvidenceLevel.Level5,
};

/** Convert `level_3` -> `3`. */
export function evidenceLevelToNumber(level: EvidenceLevel): 1 | 2 | 3 | 4 | 5 {
  return EVIDENCE_LEVEL_TO_NUMBER[level];
}

/** Convert `3` -> `level_3`. */
export function numberToEvidenceLevel(n: number): EvidenceLevel {
  const level = NUMBER_TO_EVIDENCE_LEVEL[n as 1 | 2 | 3 | 4 | 5];
  if (!level) {
    throw new RangeError(`Evidence level must be 1-5, received ${n}`);
  }
  return level;
}

/** Only Level 4 and Level 5 evidence may be marked verified (SPEC). */
export function canBeVerified(level: EvidenceLevel): boolean {
  return level === EvidenceLevel.Level4 || level === EvidenceLevel.Level5;
}
