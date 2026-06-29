"use client";

/**
 * "Lead Command Center" filter card. Prominent full-width search on top, a
 * responsive grid of labeled dropdowns below, verified-only toggle, and clear.
 * Read-only client state — nothing persists. State/county options are passed in
 * (derived from the data), keeping the UI state-agnostic.
 */

import { Search, SlidersHorizontal, X } from "lucide-react";

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

const controlClass =
  "h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 shadow-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100";

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
      <select className={controlClass} value={value} onChange={(e) => onChange(e.target.value)}>
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
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header row */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-slate-800">Lead Command Center</h2>
          {activeCount > 0 && (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
              {activeCount} active
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={activeCount === 0}
          className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 px-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </button>
      </div>

      <div className="space-y-3 p-4">
        {/* Prominent search */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onChange({ search: e.target.value })}
              placeholder="Search owner, business, address, city, county, state, case number…"
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50/60 pl-10 pr-3 text-sm text-slate-800 shadow-sm transition-colors focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <label className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
            <input
              type="checkbox"
              checked={filters.verifiedOnly}
              onChange={(e) => onChange({ verifiedOnly: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-200"
            />
            Verified only
          </label>
        </div>

        {/* Dropdown grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
              placeholder="$0"
              className={controlClass}
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
              className={controlClass}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
