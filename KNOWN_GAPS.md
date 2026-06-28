# Known Gaps

Tracked, intentional limitations of the current Surplus IQ MVP. These are not
bugs to "fix" casually — read the rationale before changing the related code.

## 1. Evidence Level 5 is not produced by the MVP (L4 cap is intentional)

**Current behavior.** The surplus calculator (`lib/surplus/calculate-surplus.ts`)
produces verified leads at **Evidence Level 4** at most. A lead reaches Level 4 /
`verified` only when an official county/court list supplies a confirmed surplus
amount (`verified_surplus_amount`).

**Why Level 5 is withheld.** Per SPEC, the evidence levels are:

- **Level 4** — a county surplus/excess list confirms the *funds*.
- **Level 5** — a county source confirms the *funds* **and** the *owner/entity*
  identity, from the **same official source**.

The calculator's inputs are sale/debt figures, jurisdiction, source type, and a
verified amount. They do **not** prove that the owner/entity name came from the
same official source that confirmed the funds. The owner name on a lead may have
been parsed from a different document (deed, docket, scrape). Asserting Level 5
from that would be fabricating provenance.

**Rule: do NOT fabricate Level 5 from surplus math or owner parsing alone.**
The L4 cap is correct and deliberate. The owner parser identifying a clean
entity/individual is **not** sufficient evidence for L5.

**What a correct L4 → L5 upgrade requires (future enrichment step).** A dedicated
enrichment pass must cross-check, and agree across:

- the **owner/entity source** (where the name came from),
- the **funds source** (where the confirmed amount came from),
- the **Source Registry** entry for that jurisdiction (is it an official Tier 1/2
  county list?),
- **docket / source evidence**, and
- the per-lead **Evidence** records.

Only when the owner/entity and the confirmed funds demonstrably originate from the
**same official source** may a lead be upgraded to Level 5. Until that step exists,
Level 5 is unreachable by design.
