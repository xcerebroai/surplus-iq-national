/**
 * Sidebar navigation definitions. Shared by the sidebar and the shell so the
 * active section, page title, and subtitle stay in sync.
 */

import {
  LayoutList,
  Database,
  Upload,
  ShieldCheck,
  AlertTriangle,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type SectionId =
  | "leads"
  | "sources"
  | "imports"
  | "validation"
  | "known-gaps"
  | "settings";

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
    id: "sources",
    label: "Source Registry",
    icon: Database,
    title: "Source Registry",
    subtitle: "Public surplus data sources by state, county, and access level.",
  },
  {
    id: "imports",
    label: "Import Center",
    icon: Upload,
    title: "Import Center",
    subtitle: "Ingest public county surplus lists and files.",
  },
  {
    id: "validation",
    label: "Validation Rules",
    icon: ShieldCheck,
    title: "Validation Rules",
    subtitle: "Surplus calculation and verification rules.",
  },
  {
    id: "known-gaps",
    label: "Known Gaps",
    icon: AlertTriangle,
    title: "Known Gaps",
    subtitle: "Documented, intentional limitations of the current MVP.",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    title: "Settings",
    subtitle: "Dashboard configuration.",
  },
];

export const DEFAULT_SECTION: SectionId = "leads";
