"use client";

import { TrendingUp } from "lucide-react";

import { NAV_ITEMS, type SectionId } from "@/components/dashboard/nav";

export function Sidebar({
  active,
  onSelect,
}: {
  active: SectionId;
  onSelect: (id: SectionId) => void;
}) {
  return (
    <aside className="flex w-16 shrink-0 flex-col bg-slate-900 text-slate-300 sm:w-64">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-3 sm:px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-900/40">
          <TrendingUp className="h-5 w-5" />
        </div>
        <div className="hidden min-w-0 sm:block">
          <p className="truncate text-sm font-semibold tracking-tight text-white">Surplus IQ</p>
          <p className="truncate text-[11px] text-blue-300/80">National Lead Intelligence</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2 sm:p-3">
        <p className="mb-1 hidden px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:block">
          Workspace
        </p>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              title={item.label}
              aria-current={isActive ? "page" : undefined}
              className={`group relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors sm:px-3 ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 hidden h-5 w-1 -translate-y-1/2 rounded-r bg-blue-300 sm:block" />
              )}
              <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
              <span className="hidden truncate sm:inline">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-3 sm:p-4">
        <div className="hidden items-center gap-2 sm:flex">
          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
          <div className="min-w-0">
            <p className="truncate text-[11px] font-medium text-slate-300">Static MVP</p>
            <p className="truncate text-[10px] text-slate-500">Read-only · no backend</p>
          </div>
        </div>
        <span className="mx-auto block h-2 w-2 rounded-full bg-emerald-400 sm:hidden" />
      </div>
    </aside>
  );
}
