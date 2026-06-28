import { LeadTable } from "@/components/leads/lead-table";

export default function Home() {
  return (
    <div className="min-h-full bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
              S
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight text-slate-900">
                Surplus IQ
              </h1>
              <p className="text-xs text-slate-500">Surplus Funds Lead Dashboard</p>
            </div>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            Static preview
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">Leads</h2>
          <p className="text-sm text-slate-500">
            Loaded client-side from a static <code>leads.json</code> artifact. Click a
            column header to sort.
          </p>
        </div>
        <LeadTable />
      </main>
    </div>
  );
}
