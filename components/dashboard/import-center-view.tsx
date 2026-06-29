import { Upload, FileSpreadsheet, FileText, Database } from "lucide-react";

/**
 * Import Center placeholder. Clearly communicates that ingestion is a future,
 * build-time capability and is not active in the read-only MVP.
 */
export function ImportCenterView() {
  const planned = [
    { icon: FileSpreadsheet, label: "CSV import", desc: "County excess / surplus list CSVs." },
    { icon: FileText, label: "Manual PDF / Excel", desc: "Upload public documents for parsing." },
    { icon: Database, label: "Source connectors", desc: "Per-county public-record adapters." },
  ];
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Upload className="h-5 w-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-800">Import Center</h2>
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                Not active in read-only MVP
              </span>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Ingestion runs at build time, not in the browser. Future CSV / manual uploads and
              per-county connectors will normalize public lists into the static lead dataset. The
              build pipeline (<code>scripts/build-data.ts</code>) is the current ingestion seam.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {planned.map((p) => {
          const Icon = p.icon;
          return (
            <div key={p.label} className="rounded-xl border border-dashed border-slate-300 bg-white p-5 shadow-sm">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <Icon className="h-4 w-4" />
              </span>
              <h3 className="mt-3 text-sm font-semibold text-slate-700">{p.label}</h3>
              <p className="mt-1 text-xs text-slate-500">{p.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
