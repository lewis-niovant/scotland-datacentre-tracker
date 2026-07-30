# Larbert Data Centre Campus (Glenbervie) — research notes

Researched 2026-07-30.

## What was checked
- **Falkirk Council portal (Idox)**: reference search located **P/26/0237/FUL** — "Construction of an AI Data Centre with 300MW Demand Utility Capacity and Car Parking, Landscaping, Roads, Access and Associated Works", Land to the northeast of Glenbervie Nursery, Stirling Road, Larbert. Received 2026-05-29, validated 2026-06-04, status *Awaiting decision*; 7,130 comments, 133 documents, 6 constraints shown at retrieval. Direct `applicationDetails.do` links need the record keyVal (not captured); the reference-search URL is stored in sources.
- **Application documents**: the Planning Statement PDF (portal doc 1644123, mirrored by APRS) could not be downloaded — aprs.scot serves a bot-protection captcha and the council document store was not directly reachable in this session. No values were taken from application documents directly; the SPICe briefing is used for floor area/heights.
- **SPICe Spotlight "Data Centres" (2026-06-26)**: two data centre buildings, 128,863 m² floor area, 25 m height (flues to 28 m), plus 11,500 m² substation.
- Developer press release + consultation microsite; DCD/FutureScot/STV/Deadline News/DataCentreNews/Project Scotland journalism; APRS material (via search excerpts only — site blocked).

## Larbert vs Glenbervie: resolved — one campus
"Larbert Data Centre Campus" and "Glenbervie" are the **same project**. Apatura originally proposed the 300MW campus on agricultural land near **Plean, Stirling**, and in October 2025 relocated it ~3 miles to land at **Glenbervie Business Park, Larbert (Falkirk)** (DCD, 2025-10-21). Apatura marketing uses "Larbert Data Centre Campus" / "Larbert AI Data Campus"; the portal address and SPICe use Glenbervie.

## Ownership
Land reported (developer, FutureScot, Scottish Enterprise's own quote in coverage) to be owned by **Scottish Enterprise**, ~55 acres allocated for business/industry. Deal structure (option/sale/lease) not disclosed. Applicant SPV: **Apatura DC Project 5 Ltd** (per Deadline News; not verified at Companies House this session — follow-up).

## Key conflicts / caveats
- **Site area**: 55 acres (press release) vs "around 50 acres" (consultation site). Recorded 55 acres with note.
- **Timeline**: press release says "first power and operations 2028"; consultation timeline says construction complete 2028, operations 2029. Both recorded.
- **Objection counts**: 1,100+ (mid-June, STV) → 3,100+ (late June, STV) → 6,833 comments / 6,719 objections / 80 support at close (Deadline News, 2026-07-03) → 7,130 portal comments (2026-07-30). Late representations reportedly still accepted.
- **Jobs**: developer figures ("5,000 jobs a year during construction", "1,300+ long-term", "500+ local") never state direct vs indirect or FTE basis; no consultant or methodology published in retrieved material. Recorded as total_jobs_unspecified / aspirational; the 500 local roles recorded cautiously as nearest proxy for direct operational jobs.
- **Generators**: 200 emergency backup **diesel** generators, 48-hour fuel supply, monthly/quarterly/annual testing (STV, from application material). Aggregate MW and fuel storage volume unknown.
- **Cooling**: developer claims **closed-loop** system minimising water use; no volumes, WUE or discharge data found — application water documents not retrieved.
- **Heat**: only a "district heat ready" design commitment; **no off-taker, heat network or funding identified** in any retrieved source.
- **Grid**: developer-side evidence only — grid offer accepted Q2 2025, "Gate 2 compliant", Denny substation, within Apatura's claimed 1.6GW pipeline. Not verified against NESO/TEC data. Network operator inferred (SP area) — verify.
- **Geo**: no red-line boundary or building layout retrieved, so `geo/` files were deliberately omitted; site.json coordinates are an approximate placement of the Glenbervie Business Park area (`location_precision: approximate`).

## Suggested follow-ups
1. Retrieve portal documents (need keyVal / document store access): Planning Statement, EIA Report (STV mentions ~52 environmental documents), Design & Access, Energy/Heat statement, Drainage — to pin down generators' MW, water volumes, heat-network feasibility, red-line boundary and building footprints.
2. Companies House check on Apatura DC Project 5 Ltd (number, officers, ownership chain).
3. Confirm EIA status, pre-determination hearing and committee dates.
4. Verify grid position against NESO connections register / TEC.
5. Track Scottish Enterprise's land transaction (FOI or SE board papers).
