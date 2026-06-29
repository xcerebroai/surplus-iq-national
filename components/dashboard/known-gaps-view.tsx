import { AlertTriangle, EyeOff, GitBranch } from "lucide-react";

/**
 * Informational summary of known, intentional gaps. Mirrors KNOWN_GAPS.md plus
 * the operational notes relevant to the static deploy. Read-only.
 */

function GapCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof AlertTriangle;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>
      <div className="space-y-2 text-sm leading-relaxed text-slate-600">{children}</div>
    </div>
  );
}

export function KnownGapsView() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <GapCard icon={AlertTriangle} title="Evidence Level 5 gap (L4 cap is intentional)">
        <p>
          The MVP produces verified leads at <strong>Evidence Level 4</strong> at most. A lead is
          Level 4 / <em>verified</em> only when an official county/court list confirms the surplus
          amount.
        </p>
        <p>
          <strong>Level 5</strong> additionally requires owner/entity provenance from the{" "}
          <em>same</em> official source that confirms the funds. The surplus helper cannot prove
          that from sale math or owner parsing alone, so it never emits Level 5.
        </p>
        <p className="text-slate-500">
          Do not fabricate Level 5. A future enrichment step must cross-check the owner source,
          funds source, Source Registry entry, docket/source evidence, and Evidence records before
          upgrading L4 → L5.
        </p>
      </GapCard>

      <GapCard icon={EyeOff} title="Public leads.json exposure (before real data)">
        <p>
          The dashboard reads <code>public/data/leads.json</code> client-side, so the full dataset
          is publicly fetchable at the deployed URL.
        </p>
        <p>
          Today that file contains <strong>sample/test data only</strong>, so this is acceptable.
          Before real lead data is loaded, decide on access controls (the static, no-auth model
          would expose it) — real data should not ship to a public Pages site as-is.
        </p>
      </GapCard>

      <GapCard icon={GitBranch} title="GitHub Actions Node 20 deprecation">
        <p>
          The Pages workflow pins actions (<code>checkout</code>, <code>setup-node</code>,{" "}
          <code>configure-pages</code>, <code>upload-pages-artifact</code>) that currently run on
          the soon-deprecated Node 20 runtime.
        </p>
        <p className="text-slate-500">
          Non-blocking today; bump to newer action major versions when convenient to silence the
          warning and stay on supported runtimes.
        </p>
      </GapCard>

      <GapCard icon={AlertTriangle} title="Read-only static MVP scope">
        <p>
          This build is intentionally static and read-only: no backend, no auth, no persistence, no
          writable review status, and no scrapers/imports yet.
        </p>
        <p className="text-slate-500">
          Filters, sorting, the detail drawer, and CSV export are all client-side over the loaded
          JSON.
        </p>
      </GapCard>
    </div>
  );
}
