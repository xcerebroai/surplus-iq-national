import { ShieldCheck, Scale, Landmark, Layers } from "lucide-react";

/**
 * Informational summary of the verification + surplus logic that the build-time
 * helpers apply. Read-only; mirrors the rules in lib/surplus.
 */

function RuleCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof ShieldCheck;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>
      <div className="space-y-2 text-sm leading-relaxed text-slate-600">{children}</div>
    </div>
  );
}

export function ValidationRulesView() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <RuleCard icon={Scale} title="Never trust opening bid alone">
        <p>
          An opening bid is not the debt. In Ohio it can reflect appraised-value rules; in
          foreclosure it is often a nominal figure. Surplus is never confirmed from an opening bid
          by itself — those rows are flagged for docket or county review.
        </p>
      </RuleCard>

      <RuleCard icon={ShieldCheck} title="Level 4+ required for verified">
        <p>
          Only leads backed by an official county/court list that confirms the funds reach{" "}
          <strong>Evidence Level 4</strong> and may be marked <em>verified</em>. Everything else is{" "}
          <em>estimated</em> or <em>needs review</em>.
        </p>
      </RuleCard>

      <RuleCard icon={Layers} title="Level 5 requires provenance enrichment">
        <p>
          Level 5 additionally requires owner/entity identity from the <em>same</em> official source
          that confirms the funds. The calculator cannot prove that from sale math alone, so it caps
          at Level 4. A future enrichment step cross-checks owner source, funds source, and the
          Source Registry before any L4 → L5 upgrade.
        </p>
      </RuleCard>

      <RuleCard icon={Landmark} title="Tax vs. foreclosure regimes differ">
        <p>
          <strong>Tax</strong> (deed / sale / foreclosure): estimate as sale price minus the amount
          required to satisfy taxes, costs, and fees — kept estimated until a county list confirms.
        </p>
        <p>
          <strong>Foreclosure</strong> (mortgage / sheriff): needs sale price and judgment/debt;
          docket review is required before a lead is usable. A negative result is marked invalid.
        </p>
      </RuleCard>
    </div>
  );
}
