/**
 * Display formatting helpers for the dashboard. Pure, locale-stable, and safe
 * for null values (everything shows a clean em dash rather than "null").
 */

/** Surplus amount at/above this is visually emphasized as high-value. */
export const HIGH_VALUE_THRESHOLD = 25000;

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

// Fixed UTC date format so prerender (Node) and client (browser) agree.
const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

/** Clean placeholder for empty / null values. */
export const EM_DASH = "—";

/** Format a dollar amount; null -> em dash. */
export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return EM_DASH;
  return USD.format(value);
}

/** Format an ISO date string -> "Jun 20, 2026"; null/invalid -> em dash. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return EM_DASH;
  const ts = Date.parse(value);
  if (Number.isNaN(ts)) return EM_DASH;
  return DATE_FMT.format(new Date(ts));
}

/** Show a string, or an em dash when null/empty/whitespace. */
export function formatText(value: string | null | undefined): string {
  if (value == null) return EM_DASH;
  const trimmed = value.trim();
  return trimmed.length > 0 ? value : EM_DASH;
}

/** Plain number -> string; null -> em dash. */
export function formatNumber(value: number | null | undefined): string {
  if (value == null) return EM_DASH;
  return value.toLocaleString("en-US");
}

/** Format a 0..1 confidence as a whole-number percent; null -> em dash. */
export function formatConfidence(value: number | null | undefined): string {
  if (value == null) return EM_DASH;
  return `${Math.round(value * 100)}%`;
}

/** True when a surplus amount should be visually emphasized. */
export function isHighValue(value: number | null | undefined): boolean {
  return value != null && value >= HIGH_VALUE_THRESHOLD;
}
