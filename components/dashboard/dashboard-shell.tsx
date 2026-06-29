"use client";

/**
 * Top-level dashboard shell: dark navy sidebar + light content area with a
 * header. Fetches the static leads.json once (base-path aware) and switches
 * sections client-side. Only "Leads" is fully functional; other sections are
 * placeholders / informational. Read-only — no backend.
 */

import { useEffect, useState } from "react";

import type { JsonLead, LeadsDataset } from "@/types/json";
import { assetPath } from "@/lib/utils/asset-path";
import { NAV_ITEMS, DEFAULT_SECTION, type SectionId } from "@/components/dashboard/nav";
import { Sidebar } from "@/components/dashboard/sidebar";
import { SectionPlaceholder } from "@/components/dashboard/section-placeholder";
import { KnownGapsView } from "@/components/dashboard/known-gaps-view";
import { SourceRegistryView } from "@/components/sources/source-registry-view";
import { LeadsView } from "@/components/leads/leads-view";

export function DashboardShell() {
  const [active, setActive] = useState<SectionId>(DEFAULT_SECTION);
  const [leads, setLeads] = useState<JsonLead[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const nav = NAV_ITEMS.find((n) => n.id === active)!;

  function renderSection() {
    switch (active) {
      case "leads":
        if (error) {
          return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              Failed to load lead data: {error}
            </div>
          );
        }
        if (!leads) {
          return (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 shadow-sm">
              Loading leads…
            </div>
          );
        }
        return <LeadsView leads={leads} />;
      case "sources":
        return <SourceRegistryView />;
      case "imports":
        return (
          <SectionPlaceholder
            title="Import Center"
            description="CSV import, manual PDF/Excel upload, source connectors, and import history will live here. The build-time pipeline (scripts/build-data.ts) is the current ingestion seam."
          />
        );
      case "validation":
        return (
          <SectionPlaceholder
            title="Validation Rules"
            description="The surplus calculation and verification rules — county-list confirmation, sale_price minus debt, Ohio/Florida specifics, and the Level 4/5 verification gate — will be viewable here."
            note="Coming soon"
          />
        );
      case "known-gaps":
        return <KnownGapsView />;
      case "settings":
        return (
          <SectionPlaceholder
            title="Settings"
            description="Dashboard configuration options will appear here."
          />
        );
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar active={active} onSelect={setActive} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-slate-900">{nav.title}</h1>
            <p className="truncate text-xs text-slate-500">{nav.subtitle}</p>
          </div>
          <span className="hidden shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 sm:inline">
            Static · read-only
          </span>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">{renderSection()}</main>
      </div>
    </div>
  );
}
