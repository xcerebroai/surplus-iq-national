You are helping me build the first foundation of a national Surplus Funds Lead Dashboard.

Project name: Surplus IQ

The goal is to build a PropStream / DealMachine style real estate lead dashboard, but focused only on public surplus funds leads from mortgage foreclosure sales and tax foreclosure / tax deed / tax sale overages.

This is NOT a CRM.
Do NOT build campaigns, SMS, email automations, follow-up tasks, appointments, call logs, or deal pipeline features.

The goal of this first build is:
1. Create the dashboard foundation.
2. Create the database schema.
3. Create the lead table.
4. Create filters.
5. Create source/evidence tracking.
6. Create import/ingestion structure for public county surplus data.
7. Create a clean UI where leads can be reviewed, filtered, saved, and exported.

The product should feel like a premium real estate data dashboard:
- Desktop-first
- Tablet responsive
- Clean sidebar navigation
- Dark navy sidebar
- White main background
- Blue accent color
- Rounded cards
- Soft shadows
- Large readable data tables
- Map/list/dashboard layout inspired by PropStream and DealMachine, but do not copy their branding, exact design, colors, logos, or layouts.

Tech stack:
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase or PostgreSQL-ready data model
- Prisma ORM if needed
- React table/data grid
- CSV import/export support
- Modular source connector architecture
- No paid map API requirement for MVP. Use placeholder map view or Leaflet/OpenStreetMap if needed.

Build this in clean, modular code.

Core principle:
Accuracy over volume.
Verified public source over assumptions.
No source, no lead.
No proof, no confirmed surplus.
If the system cannot verify something, mark it as estimated, possible, or needs review.

Main dashboard pages:
1. Overview
2. Leads
3. Mortgage Foreclosure Surplus
4. Tax Sale / Tax Deed Surplus
5. Source Registry
6. Import Center
7. Review Queue
8. Saved Views
9. Exports
10. Settings

Do not build CRM features.

The main lead table must show these columns first:
- Business Name / Entity
- First Name
- Last Name
- Property Address
- Property City
- Property State
- Property Zip Code
- Estimated Surplus Amount

Then add these secondary columns:
- Lead Type
- Sale Type
- County
- Sale Date
- Case Number
- Parcel Number
- Sale Price
- Opening Bid
- Judgment Amount
- Amount Owed
- Verified Surplus Amount
- Surplus Status
- Verification Status
- Evidence Level
- Source Name
- Source URL
- Last Checked Date
- Review Status
- Notes

Lead types:
- Mortgage Foreclosure Surplus
- Tax Deed Surplus
- Tax Sale Excess Proceeds
- Sheriff Sale Excess Proceeds
- Clerk Registry Funds
- Unclaimed Foreclosure Funds

Surplus status enum:
- confirmed_public_list
- estimated_from_sale_data
- possible_pending_docket
- possible_pending_county_review
- claim_filed
- disbursed
- expired
- invalid
- unknown

Verification status enum:
- verified
- estimated
- needs_review
- rejected
- stale
- source_error

Evidence level:
Level 1 = Raw scrape only
Level 2 = Sale data found
Level 3 = Surplus estimated from public sale data
Level 4 = County surplus/excess list confirms funds
Level 5 = County source confirms funds and owner/entity information

Only Level 4 and Level 5 can be marked as verified.
Everything else must be marked estimated or needs_review.

Important surplus logic:
For tax deed / tax sale surplus:
- If a county publishes an official excess proceeds or surplus funds list with owner/entity and amount, treat it as the highest quality source.
- If sale price is greater than opening bid or amount owed, calculate estimated surplus as sale price minus amount owed only if the source clearly identifies the opening bid/amount owed as the amount required to satisfy taxes, costs, and fees.
- If the meaning of opening bid is unclear, do not confirm surplus. Mark as possible_pending_county_review.

For mortgage foreclosure surplus:
- Never rely only on opening bid.
- Need sale price and judgment/debt/amount owed to estimate surplus.
- If the county/court publishes excess funds or registry funds, treat that as confirmed.
- If the lead only has sale price greater than opening bid, mark as possible_pending_docket.
- Docket review is required before marking usable in counties where claims, bankruptcies, motions to vacate, or third-party surplus claims may already be filed.

Ohio-specific rule:
- Do not use opening bid alone to calculate surplus.
- Opening bid may be tied to appraised value rules and may not equal the debt.
- Need judgment/decree/report of sale/confirmation or county excess fund list.

Florida-specific rule:
- Separate mortgage foreclosure from tax deed.
- Mortgage foreclosure needs case/docket review.
- Tax deed surplus should route through tax deed surplus source, county clerk, or tax deed portal.
- If auction surplus exists but docket is not checked, mark as possible_pending_docket, not verified.

Data model:

Create a Lead model with:
- id
- lead_type
- sale_type
- surplus_status
- verification_status
- evidence_level
- business_name
- first_name
- last_name
- owner_raw_name
- owner_type: individual, business, trust, estate, unknown
- property_address
- property_city
- property_state
- property_zip
- county
- state
- parcel_number
- case_number
- court_name
- sale_date
- sale_price
- opening_bid
- judgment_amount
- amount_owed
- estimated_surplus_amount
- verified_surplus_amount
- source_name
- source_type
- source_url
- source_document_url
- source_file_name
- source_last_updated
- last_checked_at
- created_at
- updated_at
- review_status
- notes
- tags
- confidence_score
- reject_reason

Create a Source Registry model with:
- id
- source_name
- source_type
- state
- county
- city
- source_url
- data_format: html, pdf, csv, xlsx, json, manual
- sale_type_supported
- lead_type_supported
- access_level: easy, moderate, hard, blocked
- requires_login
- requires_captcha
- scrape_allowed
- update_frequency
- parser_status
- last_successful_import
- notes

Create an Evidence model with:
- id
- lead_id
- evidence_type
- source_name
- source_url
- document_url
- raw_text
- extracted_amount
- extracted_date
- confidence_score
- created_at

Create an Import Job model with:
- id
- source_id
- job_status
- started_at
- finished_at
- records_found
- records_imported
- records_updated
- records_rejected
- error_message
- raw_file_path

Filters needed on the Leads page:
- State
- County
- City
- Lead Type
- Sale Type
- Surplus Status
- Verification Status
- Evidence Level
- Minimum Estimated Surplus
- Maximum Estimated Surplus
- Sale Date Range
- Last Checked Date
- Source Name
- Owner Type
- Business / Entity Only
- Individual Owner Only
- Needs Review
- Verified Only
- Estimated Only
- Exclude Claim Filed
- Exclude Disbursed
- Exclude Expired
- Has Case Number
- Has Parcel Number

Saved views:
- Verified Surplus Leads
- Estimated High Surplus
- Needs Docket Review
- Tax Deed Surplus
- Mortgage Foreclosure Surplus
- Business / Entity Owners
- Individual Owners
- Florida Tax Deed
- Ohio Needs Review
- High Value Over $10k
- High Value Over $25k

Dashboard cards:
- Total Leads
- Verified Leads
- Estimated Leads
- Needs Review
- Total Estimated Surplus
- Total Verified Surplus
- Average Surplus
- States Covered
- Counties Covered
- Sources Active
- Failed Source Imports

Main table behavior:
- Sortable columns
- Sticky header
- Bulk select
- Export selected
- Export filtered
- Export all
- Column visibility toggle
- Global search
- Lead detail drawer
- Evidence drawer
- Notes field
- Review status dropdown

Lead detail drawer should show:
- Owner/entity information
- Property information
- Sale information
- Surplus calculation
- Source evidence
- Verification status
- Review notes
- Raw source data
- Audit trail

Review Queue:
Show leads that are not ready to export:
- possible_pending_docket
- possible_pending_county_review
- unknown
- source_error
- stale
- low confidence owner parsing
- missing address
- missing surplus amount
- missing source URL

Import Center:
For MVP, create:
1. CSV import
2. Manual upload for PDF/Excel placeholder
3. Source connector placeholder
4. Import history table

The CSV importer should map fields from county/public lists into the Lead model.

Create sample seed data for:
- Florida tax deed surplus
- Florida mortgage foreclosure surplus
- Ohio foreclosure excess funds
- Georgia tax sale excess funds
- Texas excess proceeds
- California tax sale excess proceeds
- Washington tax foreclosure surplus

Source strategy:
Prioritize source types in this order:
Tier 1: Official county surplus/excess funds lists with names and amounts
Tier 2: Official county tax deed/tax sale excess proceeds lists
Tier 3: Official court/clerk registry funds lists
Tier 4: Official auction sale result pages with sale price and amount owed
Tier 5: Docket/case search sources requiring review
Tier 6: Sources requiring CAPTCHA or login should be marked blocked/manual for MVP

Do not scrape private sites.
Do not scrape behind login.
Do not bypass CAPTCHA.
Do not use illegal scraping methods.
If a source has CAPTCHA, mark it manual_review or blocked.
The system should be built to ingest public records, public PDFs, public Excel files, and public HTML pages only.

Create the folder structure:
- /app
- /components
- /components/dashboard
- /components/leads
- /components/filters
- /components/imports
- /components/sources
- /lib
- /lib/db
- /lib/parsers
- /lib/imports
- /lib/surplus
- /lib/utils
- /data
- /data/sample
- /types

Build these files:
- README.md
- schema.prisma or database types
- lead types
- source registry types
- sample source registry JSON
- sample leads JSON
- surplus calculation helper
- lead verification helper
- CSV import helper
- dashboard page
- leads page
- filters component
- lead detail drawer
- import center page
- source registry page
- review queue page

Surplus calculation helper:
Create a function that accepts:
- sale_type
- sale_price
- opening_bid
- judgment_amount
- amount_owed
- state
- county
- source_type

Return:
- estimated_surplus_amount
- confidence_score
- surplus_status
- verification_status
- evidence_level
- warning_message

Rules:
- If verified_surplus_amount exists from official county list, use that.
- If sale_price and amount_owed exist, estimated surplus = sale_price - amount_owed.
- If mortgage foreclosure and only opening_bid exists, do not confirm surplus.
- If Ohio and only opening_bid exists, do not calculate confirmed surplus.
- If Florida tax deed and opening_bid/source clearly represents statutory bid, estimated surplus can be calculated but still mark estimated unless county list confirms.
- If result is less than or equal to zero, mark invalid.
- If calculation inputs are incomplete, mark needs_review.

Owner name parser:
Create a helper to split owner_raw_name into:
- business_name
- first_name
- last_name
- owner_type

Rules:
- If name includes LLC, INC, CORP, LP, LLP, TRUST, ESTATE, BANK, ASSOCIATION, COMPANY, CO, HOLDINGS, PROPERTIES, INVESTMENTS, mark as business/entity/trust/estate.
- If individual name, split first and last carefully.
- Preserve owner_raw_name always.
- Never delete original source owner name.

UI goal:
Make it clean and easy to read.
The first visible columns must be:
Business Name / Entity, First Name, Last Name, Property Address, Property City, Property State, Property Zip, Estimated Surplus Amount.

Do not overwhelm the first screen.
Put advanced details inside the drawer.

MVP requirement:
Do not try to build every scraper right now.
First build the dashboard, schema, sample data, source registry, CSV import, filters, review queue, and export system.
Make the code ready so we can add county-specific source connectors later.

After building, provide:
1. How to run locally
2. What files were created
3. What still needs to be added
4. How to add the first real county source
5. Any assumptions made
