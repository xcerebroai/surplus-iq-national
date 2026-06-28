-- CreateEnum
CREATE TYPE "LeadType" AS ENUM ('mortgage_foreclosure_surplus', 'tax_deed_surplus', 'tax_sale_excess_proceeds', 'sheriff_sale_excess_proceeds', 'clerk_registry_funds', 'unclaimed_foreclosure_funds');

-- CreateEnum
CREATE TYPE "SaleType" AS ENUM ('mortgage_foreclosure', 'tax_deed', 'tax_sale', 'tax_foreclosure', 'sheriff_sale', 'other');

-- CreateEnum
CREATE TYPE "SurplusStatus" AS ENUM ('confirmed_public_list', 'estimated_from_sale_data', 'possible_pending_docket', 'possible_pending_county_review', 'claim_filed', 'disbursed', 'expired', 'invalid', 'unknown');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('verified', 'estimated', 'needs_review', 'rejected', 'stale', 'source_error');

-- CreateEnum
CREATE TYPE "EvidenceLevel" AS ENUM ('level_1', 'level_2', 'level_3', 'level_4', 'level_5');

-- CreateEnum
CREATE TYPE "OwnerType" AS ENUM ('individual', 'business', 'trust', 'estate', 'unknown');

-- CreateEnum
CREATE TYPE "DataFormat" AS ENUM ('html', 'pdf', 'csv', 'xlsx', 'json', 'manual');

-- CreateEnum
CREATE TYPE "AccessLevel" AS ENUM ('easy', 'moderate', 'hard', 'blocked');

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "lead_type" "LeadType" NOT NULL,
    "sale_type" "SaleType" NOT NULL,
    "surplus_status" "SurplusStatus" NOT NULL DEFAULT 'unknown',
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'needs_review',
    "evidence_level" "EvidenceLevel" NOT NULL DEFAULT 'level_1',
    "business_name" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "owner_raw_name" TEXT,
    "owner_type" "OwnerType" NOT NULL DEFAULT 'unknown',
    "property_address" TEXT,
    "property_city" TEXT,
    "property_state" TEXT,
    "property_zip" TEXT,
    "county" TEXT,
    "state" TEXT,
    "parcel_number" TEXT,
    "case_number" TEXT,
    "court_name" TEXT,
    "sale_date" TIMESTAMP(3),
    "sale_price" DECIMAL(14,2),
    "opening_bid" DECIMAL(14,2),
    "judgment_amount" DECIMAL(14,2),
    "amount_owed" DECIMAL(14,2),
    "estimated_surplus_amount" DECIMAL(14,2),
    "verified_surplus_amount" DECIMAL(14,2),
    "source_name" TEXT,
    "source_type" TEXT,
    "source_url" TEXT,
    "source_document_url" TEXT,
    "source_file_name" TEXT,
    "source_last_updated" TIMESTAMP(3),
    "last_checked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "review_status" TEXT,
    "notes" TEXT,
    "tags" TEXT[],
    "confidence_score" DOUBLE PRECISION,
    "reject_reason" TEXT,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_registry" (
    "id" TEXT NOT NULL,
    "source_name" TEXT NOT NULL,
    "source_type" TEXT,
    "state" TEXT,
    "county" TEXT,
    "city" TEXT,
    "source_url" TEXT,
    "data_format" "DataFormat" NOT NULL DEFAULT 'manual',
    "sale_type_supported" "SaleType"[],
    "lead_type_supported" "LeadType"[],
    "access_level" "AccessLevel" NOT NULL DEFAULT 'moderate',
    "requires_login" BOOLEAN NOT NULL DEFAULT false,
    "requires_captcha" BOOLEAN NOT NULL DEFAULT false,
    "scrape_allowed" BOOLEAN NOT NULL DEFAULT false,
    "update_frequency" TEXT,
    "parser_status" TEXT,
    "last_successful_import" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_registry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "evidence_type" TEXT,
    "source_name" TEXT,
    "source_url" TEXT,
    "document_url" TEXT,
    "raw_text" TEXT,
    "extracted_amount" DECIMAL(14,2),
    "extracted_date" TIMESTAMP(3),
    "confidence_score" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" TEXT NOT NULL,
    "source_id" TEXT,
    "job_status" TEXT NOT NULL DEFAULT 'pending',
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "records_found" INTEGER NOT NULL DEFAULT 0,
    "records_imported" INTEGER NOT NULL DEFAULT 0,
    "records_updated" INTEGER NOT NULL DEFAULT 0,
    "records_rejected" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "raw_file_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leads_state_idx" ON "leads"("state");

-- CreateIndex
CREATE INDEX "leads_property_state_idx" ON "leads"("property_state");

-- CreateIndex
CREATE INDEX "leads_county_idx" ON "leads"("county");

-- CreateIndex
CREATE INDEX "leads_lead_type_idx" ON "leads"("lead_type");

-- CreateIndex
CREATE INDEX "leads_sale_type_idx" ON "leads"("sale_type");

-- CreateIndex
CREATE INDEX "leads_surplus_status_idx" ON "leads"("surplus_status");

-- CreateIndex
CREATE INDEX "leads_verification_status_idx" ON "leads"("verification_status");

-- CreateIndex
CREATE INDEX "leads_source_name_idx" ON "leads"("source_name");

-- CreateIndex
CREATE INDEX "source_registry_state_idx" ON "source_registry"("state");

-- CreateIndex
CREATE INDEX "source_registry_county_idx" ON "source_registry"("county");

-- CreateIndex
CREATE INDEX "source_registry_access_level_idx" ON "source_registry"("access_level");

-- CreateIndex
CREATE INDEX "evidence_lead_id_idx" ON "evidence"("lead_id");

-- CreateIndex
CREATE INDEX "import_jobs_source_id_idx" ON "import_jobs"("source_id");

-- CreateIndex
CREATE INDEX "import_jobs_job_status_idx" ON "import_jobs"("job_status");

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "source_registry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
