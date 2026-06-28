"use client";

/**
 * Lead table — static dashboard shell.
 *
 * Fetches public/data/leads.json client-side (base-path aware so it resolves
 * on GitHub Pages) and renders the leads with SPEC's primary columns first:
 * Business Name/Entity, First, Last, Property Address, City, State, Zip,
 * Estimated Surplus. Sticky header, click-to-sort columns.
 *
 * Intentionally minimal: no filters, drawers, or review-queue interactivity
 * yet — this only proves the static data load + table render end to end. The
 * table is state-agnostic: whatever states appear in the data render as-is.
 */

import { useEffect, useMemo, useState } from "react";

import type { JsonLead, LeadsDataset } from "@/types/json";
import { assetPath } from "@/lib/utils/asset-path";

/** Primary columns, in SPEC order. `accessor` returns the raw sortable value. */
type Column = {
  key: string;
  label: string;
  accessor: (lead: JsonLead) => string | number | null;
  numeric?: boolean;
  align?: "left" | "right";
};

const COLUMNS: Column[] = [
  { key: "business_name", label: "Business Name / Entity", accessor: (l) => l.business_name },
  { key: "first_name", label: "First Name", accessor: (l) => l.first_name },
  { key: "last_name", label: "Last Name", accessor: (l) => l.last_name },
  { key: "property_address", label: "Property Address", accessor: (l) => l.property_address },
  { key: "property_city", label: "Property City", accessor: (l) => l.property_city },
  { key: "property_state", label: "State", accessor: (l) => l.property_state },
  { key: "property_zip", label: "Zip", accessor: (l) => l.property_zip },
  {
    key: "estimated_surplus_amount",
    label: "Estimated Surplus",
    accessor: (l) => l.estimated_surplus_amount,
    numeric: true,
    align: "right",
  },
];

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

type SortState = { key: string; dir: "asc" | "desc" } | null;

export function LeadTable() {
  const [leads, setLeads] = useState<JsonLead[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortState>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(assetPath("/data/leads.json"))
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<LeadsDataset>;
      })
      .then((data) => {
        if (!cancelled) setLeads(data.leads);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? "Failed to load leads");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sortedLeads = useMemo(() => {
    if (!leads) return [];
    if (!sort) return leads;
    const col = COLUMNS.find((c) => c.key === sort.key);
    if (!col) return leads;
    const factor = sort.dir === "asc" ? 1 : -1;
    return [...leads].sort((a, b) => {
      const av = col.accessor(a);
      const bv = col.accessor(b);
      // Nulls always sort to the bottom, regardless of direction.
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      if (col.numeric) return ((av as number) - (bv as number)) * factor;
      return String(av).localeCompare(String(bv)) * factor;
    });
  }, [leads, sort]);

  function toggleSort(key: string) {
    setSort((prev) => {
      if (prev?.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null; // third click clears the sort
    });
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Failed to load lead data: {error}
      </div>
    );
  }

  if (!leads) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        Loading leads…
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <h2 className="text-sm font-semibold text-slate-700">Leads</h2>
        <span className="text-xs text-slate-500">{sortedLeads.length} records</span>
      </div>
      <div className="max-h-[70vh] overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr>
              {COLUMNS.map((col) => {
                const active = sort?.key === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col.key)}
                    className={`cursor-pointer select-none whitespace-nowrap border-b border-slate-200 px-4 py-2.5 font-medium text-slate-600 hover:bg-slate-100 ${
                      col.align === "right" ? "text-right" : "text-left"
                    }`}
                    scope="col"
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      <span className="text-blue-600">
                        {active ? (sort?.dir === "asc" ? "▲" : "▼") : ""}
                      </span>
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedLeads.map((lead) => (
              <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50/70">
                <td className="px-4 py-2.5 text-slate-800">{lead.business_name ?? "—"}</td>
                <td className="px-4 py-2.5 text-slate-700">{lead.first_name ?? "—"}</td>
                <td className="px-4 py-2.5 text-slate-700">{lead.last_name ?? "—"}</td>
                <td className="px-4 py-2.5 text-slate-700">{lead.property_address ?? "—"}</td>
                <td className="px-4 py-2.5 text-slate-700">{lead.property_city ?? "—"}</td>
                <td className="px-4 py-2.5 text-slate-700">{lead.property_state ?? "—"}</td>
                <td className="px-4 py-2.5 text-slate-700">{lead.property_zip ?? "—"}</td>
                <td className="px-4 py-2.5 text-right font-medium tabular-nums text-slate-900">
                  {lead.estimated_surplus_amount !== null
                    ? currency.format(lead.estimated_surplus_amount)
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
