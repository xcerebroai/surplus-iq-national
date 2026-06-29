import { Settings as SettingsIcon, Lock } from "lucide-react";

/**
 * Settings placeholder. The static MVP has no persistence, so settings are
 * informational only.
 */
export function SettingsView() {
  const rows = [
    { label: "Deployment", value: "GitHub Pages — static export" },
    { label: "Data source", value: "public/data/leads.json (build-time)" },
    { label: "Persistence", value: "None — read-only" },
    { label: "Authentication", value: "None" },
    { label: "Base path", value: "/surplus-iq-national/" },
  ];
  return (
    <div className="max-w-2xl space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <SettingsIcon className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-800">Settings</h2>
            <p className="text-xs text-slate-500">Static MVP configuration (read-only).</p>
          </div>
        </div>
        <dl className="divide-y divide-slate-100">
          {rows.map((r) => (
            <div key={r.label} className="grid grid-cols-[160px_1fr] gap-2 py-2.5">
              <dt className="text-sm font-medium text-slate-500">{r.label}</dt>
              <dd className="text-sm text-slate-800">{r.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <Lock className="h-3.5 w-3.5" />
        No settings are persisted — this build has no backend or storage.
      </div>
    </div>
  );
}
