"use client";

/**
 * Premium leads data table. Receives already-filtered leads; handles
 * client-side column sorting and row selection. Primary SPEC columns first,
 * then classification/status/source columns. Sticky header + sticky first
 * column, horizontal scroll inside the card. View-only.
 */

import { useMemo, useState } from "react";
import { ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";

import type { JsonLead } from "@/types/json";
import { formatCurrency, formatDate, isHighValue, EM_DASH } from "@/lib/utils/format";
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
  /** Tailwind width/whitespace hints. */
  cellClass?: string;
  accessor: (lead: JsonLead) => SortValue;
  cell: (lead: JsonLead) => React.ReactNode;
}

const muted = <span className="text-slate-300">{EM_DASH}</span>;
function text(value: string | null, className = "text-slate-700") {
  return value && value.trim() ? <span className={className}>{value}</span> : muted;
}

const COLUMNS: Column[] = [
  // --- Primary columns (SPEC order, must stay first) ---
  {
    id: "business_name",
    header: "Business Name / Entity",
    cellClass: "min-w-[180px] max-w-[240px]",
    accessor: (l) => l.business_name,
    cell: (l) =>
      l.business_name ? (
        <span className="block truncate font-medium text-slate-900" title={l.business_name}>
          {l.business_name}
        </span>
      ) : (
        muted
      ),
  },
  { id: "first_name", header: "First Name", accessor: (l) => l.first_name, cell: (l) => text(l.first_name) },
  { id: "last_name", header: "Last Name", accessor: (l) => l.last_name, cell: (l) => text(l.last_name) },
  {
    id: "property_address",
    header: "Property Address",
    cellClass: "min-w-[180px] max-w-[260px]",
    accessor: (l) => l.property_address,
    cell: (l) =>
      l.property_address ? (
        <span className="block truncate text-slate-700" title={l.property_address}>
          {l.property_address}
        </span>
      ) : (
        muted
      ),
  },
  { id: "property_city", header: "Property City", accessor: (l) => l.property_city, cell: (l) => text(l.property_city) },
  { id: "property_state", header: "State", accessor: (l) => l.property_state, cell: (l) => text(l.property_state) },
  { id: "property_zip", header: "Zip", accessor: (l) => l.property_zip, cell: (l) => text(l.property_zip) },
  {
    id: "estimated_surplus_amount",
    header: "Estimated Surplus",
    align: "right",
    cellClass: "whitespace-nowrap",
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
    cellClass: "whitespace-nowrap",
    accessor: (l) => LEAD_TYPE_LABELS[l.lead_type],
    cell: (l) => <span className="text-slate-600">{LEAD_TYPE_LABELS[l.lead_type]}</span>,
  },
  {
    id: "sale_type",
    header: "Sale Type",
    cellClass: "whitespace-nowrap",
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
    id: "source_county",
    header: "Source County",
    cellClass: "whitespace-nowrap",
    accessor: (l) => l.county,
    cell: (l) => text(l.county, "text-slate-600"),
  },
  {
    id: "last_checked_at",
    header: "Last Checked",
    align: "right",
    cellClass: "whitespace-nowrap",
    accessor: (l) => l.last_checked_at,
    cell: (l) => <span className="text-slate-500">{formatDate(l.last_checked_at)}</span>,
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
      if (av == null) return 1;
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

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Title */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-3.5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-800">Lead Results</h2>
          <p className="truncate text-xs text-slate-500">
            Filtered public surplus opportunities from the static lead dataset.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          {leads.length} shown
        </span>
      </div>

      {leads.length === 0 ? (
        <div className="p-12 text-center text-sm text-slate-500">
          No leads match the current filters.
        </div>
      ) : (
        <div className="max-h-[64vh] overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-20 bg-slate-50 text-slate-600">
              <tr>
                {COLUMNS.map((col, idx) => {
                  const active = sort?.id === col.id;
                  const sticky = idx === 0 ? "sticky left-0 z-30 bg-slate-50" : "";
                  return (
                    <th
                      key={col.id}
                      scope="col"
                      onClick={() => toggleSort(col.id)}
                      className={`cursor-pointer select-none whitespace-nowrap border-b border-slate-200 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide hover:bg-slate-100 ${
                        col.align === "right" ? "text-right" : "text-left"
                      } ${sticky}`}
                    >
                      <span
                        className={`inline-flex items-center gap-1 ${
                          col.align === "right" ? "flex-row-reverse" : ""
                        }`}
                      >
                        {col.header}
                        {active ? (
                          sort?.dir === "asc" ? (
                            <ArrowUp className="h-3 w-3 text-blue-600" />
                          ) : (
                            <ArrowDown className="h-3 w-3 text-blue-600" />
                          )
                        ) : (
                          <ChevronsUpDown className="h-3 w-3 text-slate-300" />
                        )}
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
                  className={`group cursor-pointer border-b border-slate-100 transition-colors hover:bg-blue-50 ${
                    i % 2 === 1 ? "bg-slate-50" : "bg-white"
                  }`}
                >
                  {COLUMNS.map((col, idx) => (
                    <td
                      key={col.id}
                      className={`px-4 py-3 align-middle text-slate-700 ${
                        col.align === "right" ? "text-right" : "text-left"
                      } ${idx === 0 ? "sticky left-0 z-10 bg-inherit" : ""} ${col.cellClass ?? ""}`}
                    >
                      {col.cell(lead)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
