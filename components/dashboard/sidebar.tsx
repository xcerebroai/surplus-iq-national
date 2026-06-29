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
    <aside className="flex w-16 shrink-0 flex-col bg-slate-900 text-slate-300 sm:w-60">
      {/* Logo / title */}
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
          <TrendingUp className="h-5 w-5" />
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-semibold text-white">Surplus IQ</p>
          <p className="text-[11px] text-slate-400">National Lead Dashboard</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 p-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              title={item.label}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="hidden border-t border-white/10 p-4 text-[11px] text-slate-500 sm:block">
        Read-only · static MVP
      </div>
    </aside>
  );
}
