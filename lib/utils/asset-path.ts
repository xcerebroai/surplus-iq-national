/**
 * Base-path-aware URL helper.
 *
 * `output: "export"` on a GitHub Pages project subpath means the site lives at
 * e.g. /surplus-iq-national/. Next rewrites <Link>/asset URLs by `basePath`,
 * but it does NOT rewrite `fetch()` — so runtime fetches of files in /public
 * must be prefixed manually. Use {@link assetPath} for any public asset you
 * fetch at runtime (leads.json, future data files, etc.).
 *
 * NEXT_PUBLIC_BASE_PATH is injected by next.config.ts (empty locally,
 * "/surplus-iq-national" in production).
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefix a root-relative public path with the configured base path. */
export function assetPath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_PATH}${normalized}`;
}
