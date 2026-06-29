import { Construction } from "lucide-react";

/** Generic "not built in MVP yet" placeholder for inactive nav sections. */
export function SectionPlaceholder({
  title,
  description,
  note = "Not built in MVP yet",
}: {
  title: string;
  description: string;
  note?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Construction className="h-6 w-6" />
      </div>
      <h2 className="text-base font-semibold text-slate-800">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{description}</p>
      <span className="mt-4 inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
        {note}
      </span>
    </div>
  );
}
