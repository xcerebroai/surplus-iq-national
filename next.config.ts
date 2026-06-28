import type { NextConfig } from "next";

/**
 * Static export config for GitHub Pages.
 *
 * The site ships fully static (`output: "export"` -> `out/`) with no server,
 * no Prisma, and no DB at runtime. It is served from a project subpath
 * (https://xcerebroai.github.io/surplus-iq-national/), so assets and the
 * client fetch of leads.json must be prefixed with the base path.
 *
 * Base path resolution:
 *  - Production build (`npm run build`): defaults to "/surplus-iq-national".
 *  - Override anytime with NEXT_PUBLIC_BASE_PATH (e.g. "" to serve at root
 *    locally, or a different subpath for a fork).
 * The resolved value is re-exported as NEXT_PUBLIC_BASE_PATH so client code can
 * build correct fetch URLs (basePath does not rewrite fetch()).
 */
const isProd = process.env.NODE_ENV === "production";
const basePath =
  process.env.NEXT_PUBLIC_BASE_PATH ?? (isProd ? "/surplus-iq-national" : "");

const nextConfig: NextConfig = {
  output: "export",
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
