"use client";

/**
 * Client-side filter controls for the leads table. Fully controlled by
 * LeadsView; emits partial updates. Read-only UI state — nothing persists.
 * State/county option lists are passed in (derived from the data), keeping the
 * UI state-agnostic.
 */

import { Search, X } from "lucide-react";

import type { LeadFilters } from "@/lib/leads/filtering";
import {
  LEAD_TYPE_LABELS,
  SALE_TYPE_LABELS,
  SURPLUS_STATUS_LABELS,
  VERIFICATION_STATUS_LABELS,
  EVIDENCE_LEVEL_LABELS,
} from "@/lib/leads/labels";

type Option = { value: string; label: string };

function toOptions(map: Record<string, string>): Option[] {
  return Object.entries(map).map(([value, label]) => ({ value, label }));
}

const selectClass =
  "h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100";

function FilterSelect({
  label,
  value,
  options,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  options: Option[];
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <select className={selectClass} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function parseAmount(raw: string): number | null {
  if (raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function FiltersBar({
  filters,
  onChange,
  onClear,
  states,
  counties,
  activeCount,
}: {
  filters: LeadFilters;
  onChange: (patch: Partial<LeadFilters>) => void;
  onClear: () => void;
  states: string[];
  counties: string[];
  activeCount: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Search + verified toggle + clear */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="Search owner, business, address, city, county, case…"
            className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <label className="flex items-center gap-2 whitespace-nowrap text-sm text-slate-600">
          <input
            type="checkbox"
            checked={filters.verifiedOnly}
            onChange={(e) => onChange({ verifiedOnly: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-200"
          />
          Verified only
        </label>
        <button
          type="button"
          onClick={onClear}
          disabled={activeCount === 0}
          className="inline-flex h-9 items-center gap-1 whitespace-nowrap rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="h-3.5 w-3.5" />
          Clear{activeCount > 0 ? ` (${activeCount})` : ""}
        </button>
      </div>

      {/* Dropdown filters */}
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <FilterSelect
          label="State"
          placeholder="All states"
          value={filters.state}
          options={states.map((s) => ({ value: s, label: s }))}
          onChange={(v) => onChange({ state: v, county: "" })}
        />
        <FilterSelect
          label="County"
          placeholder="All counties"
          value={filters.county}
          options={counties.map((c) => ({ value: c, label: c }))}
          onChange={(v) => onChange({ county: v })}
        />
        <FilterSelect
          label="Lead Type"
          placeholder="All lead types"
          value={filters.leadType}
          options={toOptions(LEAD_TYPE_LABELS)}
          onChange={(v) => onChange({ leadType: v })}
        />
        <FilterSelect
          label="Sale Type"
          placeholder="All sale types"
          value={filters.saleType}
          options={toOptions(SALE_TYPE_LABELS)}
          onChange={(v) => onChange({ saleType: v })}
        />
        <FilterSelect
          label="Surplus Status"
          placeholder="All statuses"
          value={filters.surplusStatus}
          options={toOptions(SURPLUS_STATUS_LABELS)}
          onChange={(v) => onChange({ surplusStatus: v })}
        />
        <FilterSelect
          label="Verification"
          placeholder="All verification"
          value={filters.verificationStatus}
          options={toOptions(VERIFICATION_STATUS_LABELS)}
          onChange={(v) => onChange({ verificationStatus: v })}
        />
        <FilterSelect
          label="Evidence Level"
          placeholder="All levels"
          value={filters.evidenceLevel}
          options={toOptions(EVIDENCE_LEVEL_LABELS)}
          onChange={(v) => onChange({ evidenceLevel: v })}
        />
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">Min Surplus</span>
          <input
            type="number"
            inputMode="numeric"
            value={filters.minSurplus ?? ""}
            onChange={(e) => onChange({ minSurplus: parseAmount(e.target.value) })}
            placeholder="0"
            className={selectClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">Max Surplus</span>
          <input
            type="number"
            inputMode="numeric"
            value={filters.maxSurplus ?? ""}
            onChange={(e) => onChange({ maxSurplus: parseAmount(e.target.value) })}
            placeholder="Any"
            className={selectClass}
          />
        </label>
      </div>
    </div>
  );
}
