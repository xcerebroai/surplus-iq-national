/**
 * Sidebar navigation definitions. Shared by the sidebar and the shell so the
 * active section, page title, and subtitle stay in sync.
 */

import { LayoutList, ShieldCheck, type LucideIcon } from "lucide-react";

export type SectionId = "leads" | "validation";

export interface NavItem {
  id: SectionId;
  label: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: "leads",
    label: "Leads",
    icon: LayoutList,
    title: "Leads",
    subtitle: "Review, filter, and export public surplus funds leads.",
  },
  {
    id: "validation",
    label: "Validation Rules",
    icon: ShieldCheck,
    title: "Validation Rules",
    subtitle: "Surplus calculation and verification rules.",
  },
];

export const DEFAULT_SECTION: SectionId = "leads";
