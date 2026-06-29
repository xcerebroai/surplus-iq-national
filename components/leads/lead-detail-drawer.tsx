"use client";

/**
 * Right-side, VIEW-ONLY lead detail drawer. No editing, no save. Opens on row
 * click; closes on overlay click, the X button, or Escape. Leads with a large
 * surplus number + status badges up top, then organized read-only sections.
 */

import { useEffect } from "react";
import { X } from "lucide-react";

import type { JsonLead } from "@/types/json";
import {
  formatCurrency,
  formatDate,
  formatText,
  formatConfidence,
  isHighValue,
  EM_DASH,
} from "@/lib/utils/format";
import { leadDisplayName, effectiveSurplus } from "@/lib/leads/stats";
import {
  LEAD_TYPE_LABELS,
  SALE_TYPE_LABELS,
  OWNER_TYPE_LABELS,
} from "@/lib/leads/labels";
import {
  SurplusStatusBadge,
  VerificationStatusBadge,
  EvidenceLevelBadge,
} from "@/components/leads/lead-badges";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[136px_1fr] gap-2 py-1.5">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-800">{children}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-slate-100 px-5 py-4">
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
      <dl>{children}</dl>
    </section>
  );
}

function Money({ value, emphasize = false }: { value: number | null; emphasize?: boolean }) {
  if (value == null) return <span className="text-slate-400">{EM_DASH}</span>;
  return (
    <span className={emphasize && isHighValue(value) ? "font-semibold text-emerald-700" : "text-slate-800"}>
      {formatCurrency(value)}
    </span>
  );
}

function ExternalLink({ url }: { url: string | null }) {
  if (!url) return <span className="text-slate-400">{EM_DASH}</span>;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="break-all text-blue-600 hover:underline">
      {url}
    </a>
  );
}

export function LeadDetailDrawer({
  lead,
  onClose,
}: {
  lead: JsonLead | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!lead) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lead, onClose]);

  if (!lead) return null;

  const surplus = effectiveSurplus(lead);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Lead detail">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        {/* Header with big surplus + badges */}
        <div className="border-b border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 px-5 py-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-blue-300/80">
                {LEAD_TYPE_LABELS[lead.lead_type]}
              </p>
              <h2 className="mt-0.5 truncate text-lg font-semibold" title={leadDisplayName(lead)}>
                {leadDisplayName(lead)}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-md p-1 text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              {lead.verified_surplus_amount != null ? "Verified surplus" : "Estimated surplus"}
            </p>
            <p className="text-3xl font-bold tabular-nums text-emerald-300">
              {surplus != null ? formatCurrency(surplus) : EM_DASH}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <SurplusStatusBadge status={lead.surplus_status} />
            <VerificationStatusBadge status={lead.verification_status} />
            <EvidenceLevelBadge level={lead.evidence_level} long />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {lead.reject_reason && (
            <div className="mx-5 mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <span className="font-semibold">Reject reason: </span>
              {lead.reject_reason}
            </div>
          )}

          <Section title="Owner / Entity">
            <Field label="Raw name">{formatText(lead.owner_raw_name)}</Field>
            <Field label="Business / Entity">{formatText(lead.business_name)}</Field>
            <Field label="First name">{formatText(lead.first_name)}</Field>
            <Field label="Last name">{formatText(lead.last_name)}</Field>
            <Field label="Owner type">{OWNER_TYPE_LABELS[lead.owner_type]}</Field>
          </Section>

          <Section title="Property">
            <Field label="Address">{formatText(lead.property_address)}</Field>
            <Field label="City">{formatText(lead.property_city)}</Field>
            <Field label="State">{formatText(lead.property_state)}</Field>
            <Field label="Zip">{formatText(lead.property_zip)}</Field>
            <Field label="Parcel #">{formatText(lead.parcel_number)}</Field>
          </Section>

          <Section title="Sale / Case">
            <Field label="Sale type">{SALE_TYPE_LABELS[lead.sale_type]}</Field>
            <Field label="Lead type">{LEAD_TYPE_LABELS[lead.lead_type]}</Field>
            <Field label="Sale date">{formatDate(lead.sale_date)}</Field>
            <Field label="Case #">{formatText(lead.case_number)}</Field>
            <Field label="Court">{formatText(lead.court_name)}</Field>
            <Field label="Sale price"><Money value={lead.sale_price} /></Field>
            <Field label="Opening bid"><Money value={lead.opening_bid} /></Field>
            <Field label="Judgment"><Money value={lead.judgment_amount} /></Field>
            <Field label="Amount owed"><Money value={lead.amount_owed} /></Field>
          </Section>

          <Section title="Surplus Calculation">
            <Field label="Estimated surplus"><Money value={lead.estimated_surplus_amount} emphasize /></Field>
            <Field label="Verified surplus"><Money value={lead.verified_surplus_amount} emphasize /></Field>
            <Field label="Surplus status"><SurplusStatusBadge status={lead.surplus_status} /></Field>
          </Section>

          <Section title="Verification / Evidence">
            <Field label="Verification"><VerificationStatusBadge status={lead.verification_status} /></Field>
            <Field label="Evidence level"><EvidenceLevelBadge level={lead.evidence_level} long /></Field>
            <Field label="Confidence">{formatConfidence(lead.confidence_score)}</Field>
          </Section>

          <Section title="Source Info">
            <Field label="Source name">{formatText(lead.source_name)}</Field>
            <Field label="Source type">{formatText(lead.source_type)}</Field>
            <Field label="Source state">{formatText(lead.state)}</Field>
            <Field label="Source county">{formatText(lead.county)}</Field>
            <Field label="Source URL"><ExternalLink url={lead.source_url} /></Field>
            <Field label="Document URL"><ExternalLink url={lead.source_document_url} /></Field>
            <Field label="Source file">{formatText(lead.source_file_name)}</Field>
            <Field label="Source updated">{formatDate(lead.source_last_updated)}</Field>
            <Field label="Last checked">{formatDate(lead.last_checked_at)}</Field>
          </Section>

          <Section title="Warnings / Notes">
            <Field label="Notes">{formatText(lead.notes)}</Field>
            <Field label="Tags">
              {lead.tags.length > 0 ? lead.tags.join(", ") : <span className="text-slate-400">{EM_DASH}</span>}
            </Field>
          </Section>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-center text-xs text-slate-400">
          View-only · read-only static dashboard
        </div>
      </div>
    </div>
  );
}
