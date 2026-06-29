/**
 * Client-side CSV export of the currently-filtered leads. Pure string builder
 * (testable) plus a DOM download helper. No backend.
 */

import type { JsonLead } from "../../types/json";

export interface CsvColumn {
  header: string;
  value: (lead: JsonLead) => string;
}

function str(v: string | null): string {
  return v ?? "";
}
function num(v: number | null): string {
  return v == null ? "" : String(v);
}

/**
 * Export columns: primary owner/property fields, then classification, status,
 * evidence, financials, and source fields.
 */
export const EXPORT_COLUMNS: CsvColumn[] = [
  { header: "ID", value: (l) => l.id },
  { header: "Business Name / Entity", value: (l) => str(l.business_name) },
  { header: "First Name", value: (l) => str(l.first_name) },
  { header: "Last Name", value: (l) => str(l.last_name) },
  { header: "Owner Raw Name", value: (l) => str(l.owner_raw_name) },
  { header: "Owner Type", value: (l) => l.owner_type },
  { header: "Property Address", value: (l) => str(l.property_address) },
  { header: "Property City", value: (l) => str(l.property_city) },
  { header: "Property State", value: (l) => str(l.property_state) },
  { header: "Property Zip", value: (l) => str(l.property_zip) },
  { header: "County", value: (l) => str(l.county) },
  { header: "State", value: (l) => str(l.state) },
  { header: "Lead Type", value: (l) => l.lead_type },
  { header: "Sale Type", value: (l) => l.sale_type },
  { header: "Surplus Status", value: (l) => l.surplus_status },
  { header: "Verification Status", value: (l) => l.verification_status },
  { header: "Evidence Level", value: (l) => l.evidence_level },
  { header: "Sale Price", value: (l) => num(l.sale_price) },
  { header: "Opening Bid", value: (l) => num(l.opening_bid) },
  { header: "Judgment Amount", value: (l) => num(l.judgment_amount) },
  { header: "Amount Owed", value: (l) => num(l.amount_owed) },
  { header: "Estimated Surplus", value: (l) => num(l.estimated_surplus_amount) },
  { header: "Verified Surplus", value: (l) => num(l.verified_surplus_amount) },
  { header: "Confidence", value: (l) => num(l.confidence_score) },
  { header: "Source Name", value: (l) => str(l.source_name) },
  { header: "Source URL", value: (l) => str(l.source_url) },
  { header: "Last Checked", value: (l) => str(l.last_checked_at) },
];

/** RFC-4180 style escaping: quote if the field has a comma, quote, or newline. */
export function escapeCsvField(field: string): string {
  if (/[",\r\n]/.test(field)) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/** Build a CSV string from leads. Rows are CRLF-terminated. */
export function leadsToCsv(
  leads: JsonLead[],
  columns: CsvColumn[] = EXPORT_COLUMNS,
): string {
  const header = columns.map((c) => escapeCsvField(c.header)).join(",");
  const rows = leads.map((lead) =>
    columns.map((c) => escapeCsvField(c.value(lead))).join(","),
  );
  return [header, ...rows].join("\r\n");
}

/** Trigger a client-side download of the given CSV string (browser only). */
export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
