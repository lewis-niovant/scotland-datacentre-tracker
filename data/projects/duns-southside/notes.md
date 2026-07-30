# Southside Data Centre (Duns / Longformacus) — research notes

Researched 2026-07-30.

## What was checked

- **Planning portal (primary source, partially blocked).** The Scottish Borders Idox portal (eplanning.scotborders.gov.uk) returned HTTP 503/000 to every direct request during this session, so no portal page or document could be read first-hand. Via search-engine indexes and aggregators (planning.org.uk / plota / docs.planning.org.uk) the EIA screening record was identified: **25/01835/SCR**, keyVal **T7264GNT0BQ00**, "Erection of data centre comprising of three data centre buildings with associated infrastructure", Southside Data Centre, Land At Clawbare Cottage, Longformacus, Duns; applicant Sunlaws Development Company Limited. A mirrored application document is dated 2025-12-11 (but returned 403). One search summary claimed the record was "registered 8 July 2026", which conflicts with the 25/xxxx reference and the December 2025 mirror date — the December 2025 submission reading is preferred; the July 2026 date may belong to the separate scoping request. **Follow-up: re-check the portal directly for the SCR decision document, the PAN reference and the scoping (SCO) reference.**
- **Screening outcome.** APRS states "the development will need to have an EIA (decision letter 27 Feb 2026)". Recorded as `screening_eia_required` with decision_date 2026-02-27, but this rests on a tier-5 source and needs the decision letter itself.
- **PAN and consultation.** Border Telegraph reports SBC confirmed the PAN consultation plan (Longformacus Village Hall 4 June 2026; Westruther Village Hall 10 June 2026). ~170 residents attended (developer-side reporting). PAN reference not found.
- **Scoping.** Border Telegraph (July 2026) reports an Environmental Scoping Report submitted; full EIA + application expected "no earlier than late 2026", further engagement in autumn 2026.
- **Corporate structure.** Companies House: Sunlaws Development Company Limited, SC121007, incorporated 1989, registered at Roxburghe Estates Office, Kelso; SIC codes are restaurants + property letting (a legacy estate vehicle — Sunlaws is the estate property that became the Roxburghe Hotel). PSC history: "Second Discretionary Trust" (75%+ shares) until 1 April 2024, then four individuals with "significant influence or control" (Christie-Miller, Church, Jenkinson, Lord Andrew Victor Hope) — consistent with trustee control of a Roxburghe family trust. Officers list not captured; worth pulling for completeness.
- **Capacity provenance.** 225 MW appears only in developer material (website, briefings) and trade-press repetition; its basis (IT vs import) is never stated. APRS says 220 MW — kept as a conflicting claim. No grid connection application, TEC register entry or SPEN offer found; the "curtailed wind" framing (Fallago Rig substation, multiple wind farms) is entirely developer-stated.
- **Site and land.** Screening-stage description: three two-storey buildings, ≤24 m high, 8.1 ha ground footprint, 54,000 m² internal floorspace *per building* per Border Telegraph (trade press phrasing ambiguous — could be total; conflict preserved in site.json). 151 ha campus figure comes from trade-press summaries only. APRS: "farmland and moorland". Location: ~2 km from Longformacus, ~5 km from Westruther, 11 km from Duns, between Dirrington Great Law and Little Law, near the Southern Upland Way, 9.4 km from Fallago Rig wind farm. Coordinates in site.json (55.76, -2.54) are an approximate mid-point — no red-line plan was accessible, so **no boundary.geojson** was produced. Agricultural land classification (likely LCA class 5/6 upland, but not evidenced) and any Special Landscape Area designation were NOT verified — left out per never-guess rule.
- **Community.** "Save the Lammermuirs – Stop the Data Centre" launched late May/June 2026 (Kathleen White, Ben Charlesworth quoted); petition 6,000+ signatures (mid-June, unverified). No Duns/Longformacus & District/Westruther community council positions located — statutory consultation hasn't started.

## Conflicts preserved

1. 225 MW (developer) vs 220 MW (APRS).
2. 54,000 m² per building (×3 = 162,000 m²) vs possibly 54,000 m² total.
3. Gas backup generation (screening description, Dec 2025) vs "no diesel backup generators proposed" (June 2026) — not strictly contradictory (gas ≠ diesel) but the backup strategy is unclear.
4. Closed-loop / "no water cooling needed" vs screening-stage Scottish Water + SEPA-licensed borehole supply.
5. £2bn "investment" vs £25m/yr economic contribution vs £776m tax over 15 years — categories all fuzzy; classified conservatively in economic_claims.json.
6. Construction start: "2029 for 2030 launch" (trade press) vs "late 2028 or early 2029" (radio report of consultation).

## Suggested follow-ups

- Re-try the SBC portal: capture the SCR screening opinion, PAN ref, SCO ref and the scoping report itself (should reveal the red-line boundary → boundary.geojson, land classification, LVIA scope re Lammermuir SLA, heritage assets).
- Check NESO TEC/connections registers and any SPEN heat-map data for a 225 MW demand connection near Fallago Rig.
- Obtain the "preliminary economic study" (author unknown) behind the £47m / £776m figures.
- Monitor Duns and Longformacus & District community council minutes from autumn 2026.
- Registers of Scotland title check for the Clawbare Cottage land to confirm the legal landowner entity.
