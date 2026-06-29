"use client";

/**
 * Leads section: filters + result count + CSV export + table + detail drawer.
 * All client-side state over the loaded leads.json. Read-only.
 */

import { useMemo, useState } from "react";
import { Download } from "lucide-react";

import type { JsonLead } from "@/types/json";
import {
  applyFilters,
  deriveStates,
  deriveCounties,
  countActiveFilters,
  DEFAULT_FILTERS,
  type LeadFilters,
} from "@/lib/leads/filtering";
import { leadsToCsv, downloadCsv } from "@/lib/leads/csv";
import { FiltersBar } from "@/components/leads/filters-bar";
import { LeadTable } from "@/components/leads/lead-table";
import { LeadDetailDrawer } from "@/components/leads/lead-detail-drawer";

export function LeadsView({ leads }: { leads: JsonLead[] }) {
  const [filters, setFilters] = useState<LeadFilters>(DEFAULT_FILTERS);
  const [selected, setSelected] = useState<JsonLead | null>(null);

  const filtered = useMemo(() => applyFilters(leads, filters), [leads, filters]);
  const states = useMemo(() => deriveStates(leads), [leads]);
  const counties = useMemo(() => deriveCounties(leads, filters.state), [leads, filters.state]);
  const activeCount = countActiveFilters(filters);

  function patch(p: Partial<LeadFilters>) {
    setFilters((f) => ({ ...f, ...p }));
  }

  function exportCsv() {
    if (filtered.length === 0) return;
    downloadCsv(leadsToCsv(filtered), `surplus-iq-leads-${filtered.length}.csv`);
  }

  return (
    <div className="space-y-4">
      <FiltersBar
        filters={filters}
        onChange={patch}
        onClear={() => setFilters(DEFAULT_FILTERS)}
        states={states}
        counties={counties}
        activeCount={activeCount}
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500" data-testid="lead-count">
          Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of{" "}
          <span className="font-semibold text-slate-700">{leads.length}</span> leads
        </p>
        <button
          type="button"
          onClick={exportCsv}
          disabled={filtered.length === 0}
          data-testid="export-csv"
          className="inline-flex h-9 items-center gap-2 rounded-md bg-blue-600 px-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <LeadTable leads={filtered} onRowClick={setSelected} />

      <LeadDetailDrawer lead={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
