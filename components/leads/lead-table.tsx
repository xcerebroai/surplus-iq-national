"use client";

/**
 * Leads data table. Receives already-filtered leads from LeadsView; handles
 * client-side column sorting and row selection. Primary SPEC columns first,
 * then classification/status/source columns. View-only.
 */

import { useMemo, useState } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

import type { JsonLead } from "@/types/json";
import {
  formatCurrency,
  formatDate,
  formatText,
  isHighValue,
  EM_DASH,
} from "@/lib/utils/format";
import { LEAD_TYPE_LABELS, SALE_TYPE_LABELS } from "@/lib/leads/labels";
import {
  SurplusStatusBadge,
  VerificationStatusBadge,
  EvidenceLevelBadge,
} from "@/components/leads/lead-badges";

type SortValue = string | number | null;

interface Column {
  id: string;
  header: string;
  align?: "left" | "right";
  /** Sort key; null sorts last regardless of direction. */
  accessor: (lead: JsonLead) => SortValue;
  cell: (lead: JsonLead) => React.ReactNode;
}

const muted = <span className="text-slate-300">{EM_DASH}</span>;
function text(value: string | null) {
  return value && value.trim() ? formatText(value) : muted;
}

const COLUMNS: Column[] = [
  // --- Primary columns (SPEC order, must stay first) ---
  {
    id: "business_name",
    header: "Business Name / Entity",
    accessor: (l) => l.business_name,
    cell: (l) =>
      l.business_name ? (
        <span className="font-medium text-slate-800">{l.business_name}</span>
      ) : (
        muted
      ),
  },
  { id: "first_name", header: "First Name", accessor: (l) => l.first_name, cell: (l) => text(l.first_name) },
  { id: "last_name", header: "Last Name", accessor: (l) => l.last_name, cell: (l) => text(l.last_name) },
  {
    id: "property_address",
    header: "Property Address",
    accessor: (l) => l.property_address,
    cell: (l) => text(l.property_address),
  },
  { id: "property_city", header: "Property City", accessor: (l) => l.property_city, cell: (l) => text(l.property_city) },
  { id: "property_state", header: "Property State", accessor: (l) => l.property_state, cell: (l) => text(l.property_state) },
  { id: "property_zip", header: "Property Zip", accessor: (l) => l.property_zip, cell: (l) => text(l.property_zip) },
  {
    id: "estimated_surplus_amount",
    header: "Estimated Surplus",
    align: "right",
    accessor: (l) => l.estimated_surplus_amount,
    cell: (l) =>
      l.estimated_surplus_amount == null ? (
        muted
      ) : (
        <span
          className={
            isHighValue(l.estimated_surplus_amount)
              ? "font-semibold text-emerald-700"
              : "font-medium text-slate-900"
          }
        >
          {formatCurrency(l.estimated_surplus_amount)}
        </span>
      ),
  },
  // --- Additional columns ---
  {
    id: "lead_type",
    header: "Lead Type",
    accessor: (l) => LEAD_TYPE_LABELS[l.lead_type],
    cell: (l) => <span className="text-slate-600">{LEAD_TYPE_LABELS[l.lead_type]}</span>,
  },
  {
    id: "sale_type",
    header: "Sale Type",
    accessor: (l) => SALE_TYPE_LABELS[l.sale_type],
    cell: (l) => <span className="text-slate-600">{SALE_TYPE_LABELS[l.sale_type]}</span>,
  },
  {
    id: "surplus_status",
    header: "Surplus Status",
    accessor: (l) => l.surplus_status,
    cell: (l) => <SurplusStatusBadge status={l.surplus_status} />,
  },
  {
    id: "verification_status",
    header: "Verification",
    accessor: (l) => l.verification_status,
    cell: (l) => <VerificationStatusBadge status={l.verification_status} />,
  },
  {
    id: "evidence_level",
    header: "Evidence",
    accessor: (l) => l.evidence_level,
    cell: (l) => <EvidenceLevelBadge level={l.evidence_level} />,
  },
  {
    id: "source_state_county",
    header: "Source State / County",
    accessor: (l) => `${l.state ?? ""} ${l.county ?? ""}`.trim(),
    cell: (l) =>
      l.state || l.county ? (
        <span className="whitespace-nowrap text-slate-600">
          {l.state ?? EM_DASH}
          <span className="text-slate-300"> · </span>
          {l.county ?? EM_DASH}
        </span>
      ) : (
        muted
      ),
  },
  {
    id: "last_checked_at",
    header: "Last Checked",
    align: "right",
    accessor: (l) => l.last_checked_at,
    cell: (l) => <span className="whitespace-nowrap text-slate-500">{formatDate(l.last_checked_at)}</span>,
  },
];

type SortState = { id: string; dir: "asc" | "desc" } | null;

export function LeadTable({
  leads,
  onRowClick,
}: {
  leads: JsonLead[];
  onRowClick: (lead: JsonLead) => void;
}) {
  const [sort, setSort] = useState<SortState>(null);

  const sorted = useMemo(() => {
    if (!sort) return leads;
    const col = COLUMNS.find((c) => c.id === sort.id);
    if (!col) return leads;
    const factor = sort.dir === "asc" ? 1 : -1;
    return [...leads].sort((a, b) => {
      const av = col.accessor(a);
      const bv = col.accessor(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1; // nulls last
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * factor;
      return String(av).localeCompare(String(bv)) * factor;
    });
  }, [leads, sort]);

  function toggleSort(id: string) {
    setSort((prev) => {
      if (prev?.id !== id) return { id, dir: "asc" };
      if (prev.dir === "asc") return { id, dir: "desc" };
      return null;
    });
  }

  if (leads.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 shadow-sm">
        No leads match the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="max-h-[68vh] overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
            <tr>
              {COLUMNS.map((col) => {
                const active = sort?.id === col.id;
                return (
                  <th
                    key={col.id}
                    scope="col"
                    onClick={() => toggleSort(col.id)}
                    className={`cursor-pointer select-none whitespace-nowrap border-b border-slate-200 px-4 py-2.5 font-semibold text-slate-600 hover:bg-slate-100 ${
                      col.align === "right" ? "text-right" : "text-left"
                    }`}
                  >
                    <span
                      className={`inline-flex items-center gap-1 ${
                        col.align === "right" ? "flex-row-reverse" : ""
                      }`}
                    >
                      {col.header}
                      {active &&
                        (sort?.dir === "asc" ? (
                          <ArrowUp className="h-3 w-3 text-blue-600" />
                        ) : (
                          <ArrowDown className="h-3 w-3 text-blue-600" />
                        ))}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((lead, i) => (
              <tr
                key={lead.id}
                onClick={() => onRowClick(lead)}
                className={`cursor-pointer border-b border-slate-100 transition-colors hover:bg-blue-50/60 ${
                  i % 2 === 1 ? "bg-slate-50/40" : "bg-white"
                }`}
              >
                {COLUMNS.map((col) => (
                  <td
                    key={col.id}
                    className={`px-4 py-2.5 align-middle text-slate-700 ${
                      col.align === "right" ? "text-right" : "text-left"
                    }`}
                  >
                    {col.cell(lead)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
