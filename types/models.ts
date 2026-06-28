/**
 * Surplus IQ — shared model interfaces.
 *
 * Hand-written mirror of the Prisma models in `prisma/schema.prisma`, so the
 * app can reference one canonical shape without importing the generated client.
 *
 * Money columns are Decimal(14,2) in Postgres. The generated Prisma client
 * returns them as `Prisma.Decimal` objects at runtime; here they are typed as
 * `number | null` for the domain/UI/calculation layer. Convert at the boundary
 * (e.g. `lead.sale_price?.toNumber()`) when reading via the Prisma client.
 *
 * Date columns are `DateTime` in Prisma (JS `Date` at runtime); typed as `Date`
 * here. Over the wire (JSON) they serialize to ISO strings — narrow as needed.
 */

import type {
  AccessLevel,
  DataFormat,
  EvidenceLevel,
  LeadType,
  OwnerType,
  SaleType,
  SurplusStatus,
  VerificationStatus,
} from "./enums";

/** A single surplus-funds lead. Mirrors model `Lead` (table `leads`). */
export interface Lead {
  id: string;

  // Classification
  lead_type: LeadType;
  sale_type: SaleType;
  surplus_status: SurplusStatus;
  verification_status: VerificationStatus;
  evidence_level: EvidenceLevel;

  // Owner / entity
  business_name: string | null;
  first_name: string | null;
  last_name: string | null;
  owner_raw_name: string | null;
  owner_type: OwnerType;

  // Property location
  property_address: string | null;
  property_city: string | null;
  property_state: string | null;
  property_zip: string | null;

  // Jurisdiction
  county: string | null;
  state: string | null;

  // Identifiers
  parcel_number: string | null;
  case_number: string | null;
  court_name: string | null;

  // Sale / financials (Decimal in DB; number in the domain layer)
  sale_date: Date | null;
  sale_price: number | null;
  opening_bid: number | null;
  judgment_amount: number | null;
  amount_owed: number | null;
  estimated_surplus_amount: number | null;
  verified_surplus_amount: number | null;

  // Provenance
  source_name: string | null;
  source_type: string | null;
  source_url: string | null;
  source_document_url: string | null;
  source_file_name: string | null;
  source_last_updated: Date | null;
  last_checked_at: Date | null;

  // Bookkeeping
  created_at: Date;
  updated_at: Date;

  // Review workflow
  review_status: string | null;
  notes: string | null;
  tags: string[];
  confidence_score: number | null;
  reject_reason: string | null;
}

/** A cataloged public data source. Mirrors model `SourceRegistry`. */
export interface SourceRegistry {
  id: string;

  source_name: string;
  source_type: string | null;
  state: string | null;
  county: string | null;
  city: string | null;
  source_url: string | null;

  data_format: DataFormat;

  sale_type_supported: SaleType[];
  lead_type_supported: LeadType[];

  access_level: AccessLevel;
  requires_login: boolean;
  requires_captcha: boolean;
  scrape_allowed: boolean;

  update_frequency: string | null;
  parser_status: string | null;
  last_successful_import: Date | null;
  notes: string | null;

  created_at: Date;
  updated_at: Date;
}

/** A piece of supporting evidence attached to a Lead. Mirrors model `Evidence`. */
export interface Evidence {
  id: string;

  lead_id: string;

  evidence_type: string | null;
  source_name: string | null;
  source_url: string | null;
  document_url: string | null;
  raw_text: string | null;
  extracted_amount: number | null;
  extracted_date: Date | null;
  confidence_score: number | null;

  created_at: Date;
}

/** A run of an ingestion job. Mirrors model `ImportJob` (table `import_jobs`). */
export interface ImportJob {
  id: string;

  source_id: string | null;

  job_status: string;

  started_at: Date | null;
  finished_at: Date | null;

  records_found: number;
  records_imported: number;
  records_updated: number;
  records_rejected: number;

  error_message: string | null;
  raw_file_path: string | null;

  created_at: Date;
}

// ---------------------------------------------------------------------------
// Relation-loaded variants (convenience)
// ---------------------------------------------------------------------------

/** A Lead with its evidence rows eagerly loaded. */
export interface LeadWithEvidence extends Lead {
  evidence: Evidence[];
}

/** A SourceRegistry with its import jobs eagerly loaded. */
export interface SourceRegistryWithImports extends SourceRegistry {
  imports: ImportJob[];
}
