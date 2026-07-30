# Haspielaw (Hamilton) — research notes

Researched 2026-07-30.

## What was checked

- **South Lanarkshire Idox portal** (publicaccess.southlanarkshire.gov.uk): unreachable from the research environment (connection failed, HTTP 000). Official URLs recorded but content unverified directly.
- **PlanIt API** (mirror of the council register): the decisive source. Full record for **P/25/0490** — "Screening opinion request", Land At Haspielaw Farm, Muttonhole Road, Hamilton ML3 8RX; received 2025-04-29, validated 2025-05-13, decision **"Screening opinion - EIA required"** issued 2025-06-25 (decision_date field 2025-06-26 — one-day discrepancy in the register), delegated; ward 18 Hamilton West and Earnock; point 55.741923, -4.072860 (E/N 269965/651784); keyVal SVHBOUOP09500. Agent address **1 Bar Lane, York YO1 6JU** — matches Apatura's York office, the only register-side corroboration of the Apatura attribution (applicant name shown as "See source").
- **PAN search**: PlanIt full-text searches for "Haspielaw", "Muttonhole" and "data centre" in South Lanarkshire (windows up to ~5 years) returned only P/25/0490 and the Cadzow BESS S36 consultation. **No PAN, scoping request or application found.** Caveat: PlanIt's last scrape of P/25/0490 was July 2025; a later PAN could exist unscraped — portal check needed.
- **Foxglove briefing (2025-12-02, PDF extracted)**: lists Haspielaw Farm, developer Apatura, capacity **n/a**; explicitly could not find a developer figure and applied a **250MW working estimate** for its demand totals. Recorded as an estimate claim, not preferred.
- **APRS** (aprs.scot/hamilton-dc/): page blocked (Cloudflare) and Wayback unreachable from this environment; search snippet describes "a hyperscale data centre on Green Belt farmland south west of Hamilton", EIA required. Green belt therefore recorded as APRS's claim only; `green_belt: null` in site.json.
- **Scotsman "17 locations"** article: 403/paywalled; snippets confirm Haspielaw listed at EIA-screening stage. Corroboration only.
- **Apatura website**: data-centres page names no individual sites; no Haspielaw press release found. The 500MW campus coverage (DCD/BeBeez, June 2025) is **Ravenscraig**, not Haspielaw.
- **Companies House**: Apatura group includes APATURA LTD, APATURA DC LTD, and SPVs APATURA DC PROJECT 1–12 LTD. No public link from any numbered SPV to Haspielaw; API key unavailable, so officer/PSC digging not done.
- **Cadzow BESS** (P/25/0782 / ECU00005042): separate 500MW BESS on adjacent Muttonhole Road land by **Advance Grid Solutions Limited** (Cogeo planning; AECOM agent on the consultation), council no-objection 2026-03-24. Confirmed *not* Apatura — noted as adjacent grid context only.
- Community response: no site-specific coverage, petitions or councillor statements found. Searches for "Haspielaw" plus objection terms return only Hamilton, Ontario (Canada) data centre controversy noise. No community.json or economic_claims.json written — nothing found (recorded in unknowns).

## Conflicts / judgement calls

- Capacity: developer not-disclosed (preferred) vs Foxglove 250MW estimate — kept as separate claims.
- Green belt and land quality: campaign-asserted only; left unverified.
- Maturity M1 / status `screening`: screening request + EIA-required opinion is the sole formal record; verification_level `verified` because the register record (via mirror) was located.
- No boundary.geojson: only a point is available; no red-line or defensible polygon.

## Follow-ups

1. Retrieve P/25/0490 screening request and opinion documents from the council portal (site area ha, red-line plan, applicant name, any indicative MW/floorspace).
2. Re-check the register for a subsequent PAN or PPP application (PlanIt scrape is stale for this site).
3. Companies House: identify the applicant SPV and landowner (Registers of Scotland for Haspielaw Farm).
4. Confirm green belt designation against the South Lanarkshire LDP and the site's agricultural land class (Hutton maps).
5. Watch for EIA scoping and any grid connection disclosure (Apatura's Gate 2 portfolio breakdown).
