"use client";

/**
 * Premium KPI cards computed from the (filtered) lead set. No hardcoded values.
 */

import {
  Layers,
  BadgeCheck,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";

import type { JsonLead } from "@/types/json";
import { computeLeadStats, leadDisplayName } from "@/lib/leads/stats";
import { formatCurrency, formatNumber } from "@/lib/utils/format";

type Accent = "default" | "green" | "amber" | "blue" | "emerald";

const ACCENTS: Record<Accent, { icon: string; value: string }> = {
  default: { icon: "bg-slate-100 text-slate-600", value: "text-slate-900" },
  green: { icon: "bg-green-100 text-green-700", value: "text-green-700" },
  amber: { icon: "bg-amber-100 text-amber-700", value: "text-amber-700" },
  blue: { icon: "bg-blue-100 text-blue-700", value: "text-slate-900" },
  emerald: { icon: "bg-emerald-100 text-emerald-700", value: "text-emerald-700" },
};

function KpiCard({
  icon: Icon,
  label,
  value,
  helper,
  accent = "default",
}: {
  icon: typeof Layers;
  label: string;
  value: string;
  helper?: string;
  accent?: Accent;
}) {
  const a = ACCENTS[accent];
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${a.icon}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className={`mt-2 text-2xl font-semibold tabular-nums ${a.value}`}>{value}</p>
      {helper && <p className="mt-0.5 truncate text-xs text-slate-400">{helper}</p>}
    </div>
  );
}

export function KpiCards({
  leads,
  totalCount,
}: {
  leads: JsonLead[];
  totalCount: number;
}) {
  const stats = computeLeadStats(leads);
  const highest = stats.highestSurplus;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <KpiCard
        icon={Layers}
        label="Total Leads"
        value={formatNumber(stats.total)}
        helper={stats.total === totalCount ? "All leads" : `of ${formatNumber(totalCount)} total`}
      />
      <KpiCard
        icon={BadgeCheck}
        label="Verified"
        value={formatNumber(stats.verified)}
        helper="Level 4+ confirmed"
        accent="green"
      />
      <KpiCard
        icon={AlertTriangle}
        label="Needs Review"
        value={formatNumber(stats.needsReview)}
        helper="Pending docket / county"
        accent="amber"
      />
      <KpiCard
        icon={DollarSign}
        label="Est. Total Surplus"
        value={formatCurrency(stats.estimatedTotalSurplus)}
        helper="Across shown leads"
        accent="blue"
      />
      <KpiCard
        icon={TrendingUp}
        label="Highest Surplus"
        value={highest ? formatCurrency(highest.amount) : "—"}
        helper={highest ? leadDisplayName(highest.lead) : "No surplus in view"}
        accent="emerald"
      />
      <KpiCard
        icon={ShieldCheck}
        label="Evidence L4+"
        value={formatNumber(stats.level4Plus)}
        helper="County-confirmed funds"
      />
    </div>
  );
}
