import { test } from "node:test";
import assert from "node:assert/strict";

import {
  ingestRows,
  validateMapping,
  cleanMoney,
  cleanDate,
  cleanState,
  cleanText,
  type ListMapping,
} from "./ingest-list";

const NOW = "2026-06-29T00:00:00.000Z";

test("cleanMoney strips $/commas and handles negatives, blanks, N/A", () => {
  assert.equal(cleanMoney("$162,200.00"), 162200);
  assert.equal(cleanMoney("  1,234 "), 1234);
  assert.equal(cleanMoney("(3,500)"), -3500);
  assert.equal(cleanMoney("-42"), -42);
  assert.equal(cleanMoney(""), null);
  assert.equal(cleanMoney("N/A"), null);
  assert.equal(cleanMoney("abc"), null);
});

test("cleanDate parses common formats to UTC ISO", () => {
  assert.equal(cleanDate("2025-03-15"), "2025-03-15T00:00:00.000Z");
  assert.equal(cleanDate("3/15/2025"), "2025-03-15T00:00:00.000Z");
  assert.equal(cleanDate("03/05/2025"), "2025-03-05T00:00:00.000Z");
  assert.equal(cleanDate(""), null);
  assert.equal(cleanDate("not a date"), null);
});

test("cleanText/cleanState normalize and null-out junk", () => {
  assert.equal(cleanText("  Tampa "), "Tampa");
  assert.equal(cleanText("--"), null);
  assert.equal(cleanState("az"), "AZ");
  assert.equal(cleanState(""), null);
});

test("validateMapping rejects bad enums and missing fields", () => {
  assert.throws(() => validateMapping({ id_prefix: "x", lead_type: "tax_deed_surplus", sale_type: "tax_deed", columns: {} }));
  assert.throws(() => validateMapping({ source_name: "X", id_prefix: "x", lead_type: "BOGUS", sale_type: "tax_deed", columns: {} }));
  const ok = validateMapping({
    source_name: "X County",
    id_prefix: "x",
    lead_type: "tax_deed_surplus",
    sale_type: "tax_deed",
    columns: { owner_raw_name: "Owner" },
  });
  assert.equal(ok.source_name, "X County");
});

const officialMap: ListMapping = {
  source_name: "Maricopa County Tax Deed Excess",
  source_state: "AZ",
  source_county: "Maricopa",
  source_type: "county_surplus_list",
  lead_type: "tax_deed_surplus",
  sale_type: "tax_deed",
  id_prefix: "az-maricopa-td",
  columns: {
    owner_raw_name: "Owner Name",
    property_address: "Property",
    property_city: "City",
    property_zip: "Zip",
    case_number: "Cause",
    sale_price: "Sale Amount",
    amount_owed: "Taxes Due",
    verified_surplus_amount: "Excess Funds",
  },
};

test("official list with verified amount -> verified / level_4, tagged with source", () => {
  const rows = [
    {
      "Owner Name": "SUNSET HOLDINGS LLC",
      Property: "123 W Main St",
      City: "Phoenix",
      Zip: "85003",
      Cause: "TX2025-001",
      "Sale Amount": "$210,000.00",
      "Taxes Due": "$18,500",
      "Excess Funds": "$191,500.00",
    },
  ];
  const { leads, skipped } = ingestRows(rows, officialMap, { now: NOW, fileName: "maricopa.csv" });
  assert.equal(skipped.length, 0);
  assert.equal(leads.length, 1);
  const lead = leads[0];
  assert.equal(lead.verification_status, "verified");
  assert.equal(lead.evidence_level, "level_4");
  assert.equal(lead.verified_surplus_amount, 191500);
  assert.equal(lead.estimated_surplus_amount, 191500);
  // owner parsed by the real owner-parser
  assert.equal(lead.owner_type, "business");
  assert.equal(lead.business_name, "Sunset Holdings LLC");
  // source tagging
  assert.equal(lead.state, "AZ");
  assert.equal(lead.county, "Maricopa");
  assert.equal(lead.source_name, "Maricopa County Tax Deed Excess");
  assert.equal(lead.source_file_name, "maricopa.csv");
  assert.ok(lead.tags.includes("imported"));
});

test("skips rows with no owner and no address; flags them", () => {
  const rows = [
    { "Owner Name": "", Property: "", City: "", Zip: "" },
    { "Owner Name": "DOE JANE", Property: "5 Oak Ave", City: "Mesa", Zip: "85201" },
  ];
  const { leads, skipped } = ingestRows(rows, officialMap, { now: NOW });
  assert.equal(leads.length, 1);
  assert.equal(skipped.length, 1);
  assert.equal(skipped[0].row, 2); // first data row
  assert.match(skipped[0].reason, /no owner name or property address/);
});

test("tolerates messy data: mixed-case/padded headers, blank financials", () => {
  // Headers differ in case/spacing from the map; should still resolve.
  const rows = [
    {
      "  owner name ": "carter linda",
      property: "88 Birch Rd",
      city: "tempe",
      zip: "",
      cause: "",
      "sale amount": "",
      "taxes due": "",
      "excess funds": "",
    },
  ];
  const { leads, skipped } = ingestRows(rows, officialMap, { now: NOW });
  assert.equal(skipped.length, 0);
  assert.equal(leads.length, 1);
  // no financials -> calculator can't confirm; not verified
  assert.notEqual(leads[0].verification_status, "verified");
  assert.equal(leads[0].property_zip, null);
});

test("foreclosure list without verified amount estimates from sale - judgment", () => {
  const map: ListMapping = {
    source_name: "Mecklenburg Foreclosure Surplus",
    source_state: "NC",
    source_county: "Mecklenburg",
    source_type: "auction_results",
    lead_type: "mortgage_foreclosure_surplus",
    sale_type: "mortgage_foreclosure",
    id_prefix: "nc-meck-mf",
    columns: {
      last_name: "Last",
      first_name: "First",
      property_address: "Address",
      sale_price: "Sale Price",
      judgment_amount: "Judgment",
    },
  };
  const rows = [{ Last: "NGUYEN", First: "MICHAEL", Address: "12 Elm St", "Sale Price": "$250,000", Judgment: "$180,000" }];
  const { leads } = ingestRows(rows, map, { now: NOW });
  assert.equal(leads[0].estimated_surplus_amount, 70000);
  assert.equal(leads[0].surplus_status, "possible_pending_docket");
  assert.notEqual(leads[0].verification_status, "verified");
  // owner synthesized "NGUYEN MICHAEL" -> parsed individual
  assert.equal(leads[0].owner_type, "individual");
  assert.equal(leads[0].last_name, "Nguyen");
});

test("generates unique padded ids from id_prefix", () => {
  const rows = [
    { "Owner Name": "A LLC", Property: "1 St" },
    { "Owner Name": "B LLC", Property: "2 St" },
  ];
  const { leads } = ingestRows(rows, officialMap, { now: NOW });
  assert.equal(leads[0].id, "az-maricopa-td-0001");
  assert.equal(leads[1].id, "az-maricopa-td-0002");
});
