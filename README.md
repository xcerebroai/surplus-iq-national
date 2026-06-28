# Surplus IQ — National Surplus Funds Lead Dashboard

A premium-style real estate data dashboard focused **only** on public surplus
funds leads from mortgage foreclosure sales and tax foreclosure / tax deed /
tax sale overages. See [`SPEC.md`](./SPEC.md) for the full product spec and
[`KNOWN_GAPS.md`](./KNOWN_GAPS.md) for intentional limitations.

This is **not** a CRM. No campaigns, SMS/email, follow-ups, appointments, call
logs, or deal pipeline.

## Architecture (read this first)

- **Separate, standalone project/repo.** Surplus IQ National is its own build,
  not connected to or sharing infrastructure with any other project.
- **Static GitHub Pages export.** Next.js 16 App Router with
  `output: "export"` (`next.config.ts`). A plain build emits a fully static
  `out/` directory. There is **no `next export` command** in Next 16 — static
  export is config-driven.
- **Read-only MVP.** The deployed site does no runtime writes and has no
  persistence. Nothing is saved server-side; there is no backend.
- **Build-time data pipeline.** `npm run build` runs `prebuild` →
  `build:data` (`scripts/build-data.ts`), which reads the seed files in
  `data/sample/`, runs each record through the surplus + owner-parser helpers,
  validates them, and writes the single artifact **`public/data/leads.json`**.
  `next build` then exports the static site.
- **Client-side data load.** The dashboard fetches `public/data/leads.json` in
  the browser and renders the lead table from it. No database queries on page
  load.
- **No Supabase. No runtime Postgres. No runtime ORM.** `prisma/schema.prisma`
  is kept as the **canonical reference shape only** — it is not a runtime
  dependency and is never queried by the app. The runtime types live in
  `types/` (`enums.ts`, `models.ts`, `json.ts`), which mirror the schema.
- **State-agnostic.** Nothing hardcodes a fixed set of states. Any U.S. state
  present in `leads.json` renders automatically. The 7 states in the sample
  data are test data, not a coverage claim.
- **GitHub Pages subpath aware.** The site is served from
  `https://xcerebroai.github.io/surplus-iq-national/`, so `basePath`/
  `assetPrefix` are set and `fetch()` URLs are prefixed via
  `lib/utils/asset-path.ts`.

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui ·
static export. Prisma schema retained for reference only.

## Project layout

```
app/                     Next.js App Router (static dashboard shell)
components/leads/         Lead table (client component)
data/sample/             Seed lead JSON (test data; input to the build script)
lib/surplus/             calculate-surplus + owner-parser helpers (+ tests)
lib/utils/               base-path-aware asset helper
scripts/build-data.ts    Build-time pipeline -> public/data/leads.json
types/                   Canonical enums/models + JSON-serialized shapes
prisma/schema.prisma     Reference data model only (NOT a runtime dependency)
public/data/leads.json   Generated artifact the dashboard reads (gitignored)
```

## Local development

```bash
npm install

# Regenerate the data artifact only:
npm run build:data        # -> public/data/leads.json

# Run unit tests (surplus + owner-parser helpers):
npm test

# Dev server (serves at http://localhost:3000):
npm run dev

# Production static export -> ./out
npm run build             # prebuild (build:data) then next build
```

To preview the production build exactly as GitHub Pages serves it (under the
`/surplus-iq-national/` subpath), serve `out/` from a parent directory named
`surplus-iq-national`, or build with `NEXT_PUBLIC_BASE_PATH="" npm run build`
to serve at the root locally.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which runs
`npm run build` (so the data pipeline regenerates `leads.json` before export)
and publishes `out/` to GitHub Pages.

> **Repo setting required:** Settings → Pages → **Source = "GitHub Actions"**.

## Status / scope

MVP foundation: schema/types, sample data, build pipeline, surplus + owner
helpers, and a read-only static dashboard table. **Not yet built:** filters,
lead/evidence drawers, review queue, imports, saved views, exports, and the
other dashboard pages. The current verified ceiling is **Evidence Level 4** —
see [`KNOWN_GAPS.md`](./KNOWN_GAPS.md).
