"use client";

/**
 * Compact summary of active filters as removable chips. Each chip clears its
 * own filter; purely client-side.
 */

import { X } from "lucide-react";

import type { LeadFilters } from "@/lib/leads/filtering";
import { DEFAULT_FILTERS } from "@/lib/leads/filtering";
import {
  LEAD_TYPE_LABELS,
  SALE_TYPE_LABELS,
  SURPLUS_STATUS_LABELS,
  VERIFICATION_STATUS_LABELS,
  EVIDENCE_LEVEL_LABELS,
} from "@/lib/leads/labels";
import { formatCurrency } from "@/lib/utils/format";
import type {
  LeadType,
  SaleType,
  SurplusStatus,
  VerificationStatus,
  EvidenceLevel,
} from "@/types/enums";

interface Chip {
  key: string;
  label: string;
  /** Filter patch that clears this chip. */
  clear: Partial<LeadFilters>;
}

function buildChips(f: LeadFilters): Chip[] {
  const chips: Chip[] = [];
  if (f.search.trim())
    chips.push({ key: "search", label: `“${f.search.trim()}”`, clear: { search: "" } });
  if (f.state) chips.push({ key: "state", label: `State: ${f.state}`, clear: { state: "", county: "" } });
  if (f.county) chips.push({ key: "county", label: `County: ${f.county}`, clear: { county: "" } });
  if (f.leadType)
    chips.push({ key: "leadType", label: LEAD_TYPE_LABELS[f.leadType as LeadType], clear: { leadType: "" } });
  if (f.saleType)
    chips.push({ key: "saleType", label: SALE_TYPE_LABELS[f.saleType as SaleType], clear: { saleType: "" } });
  if (f.surplusStatus)
    chips.push({
      key: "surplusStatus",
      label: SURPLUS_STATUS_LABELS[f.surplusStatus as SurplusStatus],
      clear: { surplusStatus: "" },
    });
  if (f.verificationStatus)
    chips.push({
      key: "verificationStatus",
      label: VERIFICATION_STATUS_LABELS[f.verificationStatus as VerificationStatus],
      clear: { verificationStatus: "" },
    });
  if (f.evidenceLevel)
    chips.push({
      key: "evidenceLevel",
      label: EVIDENCE_LEVEL_LABELS[f.evidenceLevel as EvidenceLevel],
      clear: { evidenceLevel: "" },
    });
  if (f.minSurplus != null)
    chips.push({ key: "minSurplus", label: `Min ${formatCurrency(f.minSurplus)}`, clear: { minSurplus: null } });
  if (f.maxSurplus != null)
    chips.push({ key: "maxSurplus", label: `Max ${formatCurrency(f.maxSurplus)}`, clear: { maxSurplus: null } });
  if (f.verifiedOnly)
    chips.push({ key: "verifiedOnly", label: "Verified only", clear: { verifiedOnly: false } });
  return chips;
}

export function FilterChips({
  filters,
  onChange,
  onClear,
}: {
  filters: LeadFilters;
  onChange: (patch: Partial<LeadFilters>) => void;
  onClear: () => void;
}) {
  const chips = buildChips(filters);
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-slate-400">Active:</span>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onChange(chip.clear)}
          className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20 transition-colors hover:bg-blue-100"
        >
          {chip.label}
          <X className="h-3 w-3" />
        </button>
      ))}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-medium text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

export { DEFAULT_FILTERS };
