import type { Tone } from "@/lib/leads/labels";

const TONE_CLASSES: Record<Tone, string> = {
  gray: "bg-slate-100 text-slate-600 ring-slate-500/20",
  slate: "bg-slate-100 text-slate-700 ring-slate-500/30",
  blue: "bg-blue-50 text-blue-700 ring-blue-600/20",
  green: "bg-green-50 text-green-700 ring-green-600/20",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  amber: "bg-amber-50 text-amber-800 ring-amber-600/20",
  orange: "bg-orange-50 text-orange-700 ring-orange-600/20",
  red: "bg-red-50 text-red-700 ring-red-600/20",
  purple: "bg-purple-50 text-purple-700 ring-purple-600/20",
};

export function StatusBadge({
  tone,
  children,
  className = "",
}: {
  tone: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
