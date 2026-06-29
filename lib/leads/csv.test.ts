import { test } from "node:test";
import assert from "node:assert/strict";

import { leadsToCsv, escapeCsvField, EXPORT_COLUMNS, type CsvColumn } from "./csv";
import type { JsonLead } from "../../types/json";
import {
  LeadType,
  SaleType,
  SurplusStatus,
  VerificationStatus,
  EvidenceLevel,
  OwnerType,
} from "../../types/enums";

function makeLead(overrides: Partial<JsonLead>): JsonLead {
  return {
    id: "x-1",
    lead_type: LeadType.TaxSaleExcessProceeds,
    sale_type: SaleType.TaxSale,
    surplus_status: SurplusStatus.EstimatedFromSaleData,
    verification_status: VerificationStatus.Estimated,
    evidence_level: EvidenceLevel.Level3,
    business_name: null,
    first_name: null,
    last_name: null,
    owner_raw_name: null,
    owner_type: OwnerType.Unknown,
    property_address: null,
    property_city: null,
    property_state: null,
    property_zip: null,
    county: null,
    state: null,
    parcel_number: null,
    case_number: null,
    court_name: null,
    sale_date: null,
    sale_price: null,
    opening_bid: null,
    judgment_amount: null,
    amount_owed: null,
    estimated_surplus_amount: null,
    verified_surplus_amount: null,
    source_name: null,
    source_type: null,
    source_url: null,
    source_document_url: null,
    source_file_name: null,
    source_last_updated: null,
    last_checked_at: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    review_status: null,
    notes: null,
    tags: [],
    confidence_score: null,
    reject_reason: null,
    ...overrides,
  };
}

test("escapeCsvField quotes fields containing comma/quote/newline", () => {
  assert.equal(escapeCsvField("plain"), "plain");
  assert.equal(escapeCsvField("a,b"), '"a,b"');
  assert.equal(escapeCsvField('he said "hi"'), '"he said ""hi"""');
  assert.equal(escapeCsvField("line1\nline2"), '"line1\nline2"');
});

test("leadsToCsv emits a header plus one row per lead", () => {
  const leads = [makeLead({ id: "a" }), makeLead({ id: "b" })];
  const lines = leadsToCsv(leads).split("\r\n");
  assert.equal(lines.length, 3); // header + 2
  assert.equal(lines[0], EXPORT_COLUMNS.map((c) => c.header).join(","));
});

test("leadsToCsv writes values and blanks for nulls", () => {
  const lead = makeLead({
    business_name: "Acme, LLC", // comma forces quoting
    estimated_surplus_amount: 67650,
    property_city: null,
  });
  const cols: CsvColumn[] = [
    { header: "Business", value: (l) => l.business_name ?? "" },
    { header: "City", value: (l) => l.property_city ?? "" },
    { header: "Surplus", value: (l) => (l.estimated_surplus_amount == null ? "" : String(l.estimated_surplus_amount)) },
  ];
  const row = leadsToCsv([lead], cols).split("\r\n")[1];
  assert.equal(row, '"Acme, LLC",,67650');
});

test("empty lead set still produces a header row", () => {
  const csv = leadsToCsv([]);
  assert.equal(csv.split("\r\n").length, 1);
});
