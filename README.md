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
data/sources/            Drop folder: public lists (CSV/XLSX) + <name>.map.json
lib/surplus/             calculate-surplus + owner-parser helpers (+ tests)
lib/leads/process-lead   Shared owner+surplus processing (seed and imports)
lib/imports/             CSV/XLSX readers + generic public-list ingester
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

## How to add a public list

Surplus IQ ingests public surplus / excess-funds lists at **build time** — no
backend, no runtime upload. To add a real county/clerk list:

1. **Drop the raw file** in `data/sources/`. CSV and Excel (`.xlsx`) are
   supported, e.g. `data/sources/harris-tx-excess.csv`.

2. **Create a mapping** next to it named `<same-base-name>.map.json`
   (e.g. `data/sources/harris-tx-excess.map.json`). It tells the ingester which
   source columns map to which Lead fields. Only mapped columns are used;
   everything else is ignored.

   ```jsonc
   {
     "source_name": "Harris County Tax Deed Excess Proceeds",
     "source_state": "TX",          // fallback state when no per-row column
     "source_county": "Harris",     // fallback county
     "source_type": "county_surplus_list", // marks an official list
     "source_url": "https://example.gov/harris/excess",
     "lead_type": "tax_sale_excess_proceeds", // must be a valid LeadType
     "sale_type": "tax_foreclosure",          // must be a valid SaleType
     "id_prefix": "tx-harris-excess",         // unique; ids become <prefix>-0001
     "columns": {
       "owner_raw_name": "Owner Name",
       "property_address": "Property Address",
       "property_city": "City",
       "property_zip": "Zip",
       "case_number": "Cause Number",
       "sale_date": "Sale Date",
       "sale_price": "Sale Amount",
       "amount_owed": "Taxes Due",
       "verified_surplus_amount": "Excess Funds"
     }
   }
   ```

   Mappable Lead fields: `owner_raw_name` (or `business_name` / `first_name` /
   `last_name`), `property_address`, `property_city`, `property_state`,
   `property_zip`, `county`, `state`, `parcel_number`, `case_number`,
   `court_name`, `sale_date`, `sale_price`, `opening_bid`, `judgment_amount`,
   `amount_owed`, `estimated_surplus_amount`, `verified_surplus_amount`,
   `source_url`, `source_document_url`, `last_checked_at`.

3. **Run the build:**

   ```bash
   npm run build:data   # ingest into public/data/leads.json (quick)
   # or
   npm run build        # full static export -> out/
   ```

Each row is normalized (currency strings like `$1,234.00`, `(123)`, mixed-case
or padded headers, blank cells) and run through the **same** owner-parser and
surplus/verification helpers as the seed data. Provide a confirmed
`verified_surplus_amount` from an official list to reach Level 4 / *verified*;
otherwise the calculator estimates and flags for review. Rows with no usable
owner **and** no address are skipped and logged — they don't crash the build.
Any new state/county in the data appears in the dashboard filters automatically.

> Sample lists live in `data/sources/` (an AZ tax-deed CSV, an NC foreclosure
> CSV, and a NV clerk-surplus XLSX) and are ingested on every build.

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
