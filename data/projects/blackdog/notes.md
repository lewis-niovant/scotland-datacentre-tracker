# Blackdog data centre & AI campus — research notes (2026-07-30)

## What this project is
On 20–22 April 2026 Ashfield Land (property developer, Bristol) and TechRE (data centre specialist, Edinburgh-registered entities) announced a "multi-gigawatt" data centre and AI campus on ~200 acres at Blackdog, five miles north of Aberdeen, including a former MoD firing range, starting with a claimed 600 MW of "renewable and grid connected power", ground-breaking hoped for 2026 "subject to final commercial agreements". APRS reproduces the full press release.

## Consented phase vs headline ambition — the key finding
The press release states "planning consent has already been secured with Aberdeenshire Council for the first phase of the campus". No data-centre planning application exists. The consent relied on is **APP/2016/0766**, a planning permission in principle for a *mixed-use town centre* scheme (regional food hall, retail, leisure, Class 3, business/industrial Classes 4–6, A90 access works, low carbon infrastructure) on "Land to West and South West of Rifle Range, Blackdog" — lodged March/April 2016 by Ashfield Land and Kirkwood Homes, approved unanimously by councillors on 27 April 2017, notified to Scottish Ministers (NA-ABS-045) and cleared back to the council on 22 August 2017. The developers themselves only say they "believe plans for the multi-billion pound data centre would align with these conditions" (APRS quoting the press release). So:

- **Consented**: a 2016-era mixed-use PPiP (Energetica described the mixed-use development as 71 acres), decision-notice date/conditions not inspected.
- **Announced**: a 200-acre, 600 MW-initial / multi-GW data centre with no application, no EIA screening/scoping, no PAN found.
- Detailed planning (MSC or a fresh application) is explicitly "yet to be submitted" (APRS; corroborated by press).
- Unresolved: whether the PPiP is still extant (lapse rules) and whether a hyperscale data centre falls within its use classes/conditions.

## Portal access
The Aberdeenshire Idox portal (upa.aberdeenshire.gov.uk) was **unreachable from this research environment** — WebFetch returned 503 and direct TLS connections were reset (WAF). APP/2016/0766's reference, description and address were verified through the Scottish Government notification record instead (tier 2). Decision date of the formal notice, conditions, and any s75 remain unverified — top follow-up.

## Jobs — classification
2026 data centre claims (all developer-stated, aspirational, no methodology/consultant, conditional on full scale): ~1,000 construction jobs (type unstated — recorded as peak_construction_workforce); ~100 permanent high-skilled roles (direct_operational_jobs — note this is the only permanent direct figure); up to 2,000 indirect jobs (indirect_operational_jobs). Distinct from the 2016 mixed-use scheme's claims (1,200 construction, 1,500 long-term FT jobs, £586m salaries/25yrs, £1.56bn GVA), which are recorded separately and marked superseded/contextual.

## Grid / offshore wind
Rhetorical rather than contractual on all evidence found: "exploring the potential for private-wire connections"; "discussions are taking place" with Cerulean Winds about a feasibility of a link to the Aspen floating wind farm; Cerulean's quote makes clear Aspen supplies the grid and oil & gas decarbonisation first, private wire "as the project scales up". TechRE claims access to 3 GW of wind, "significant grid connections" and international subsea cable landing capability — none evidenced in NESO/SSEN/Ofgem material located. No connection application, offer or Gate 2 status found for 600 MW.

## Land history
- Former MoD rifle/firing ranges (Aberdeenshire HER NJ91SE0004).
- Allocated in the 2012 Aberdeenshire LDP; Blackdog Masterplan approved 2013; Energetica corridor at the A90/AWPR junction.
- Housing element (Kirkwood Homes, later Persimmon phases e.g. APP/2025/0075) consented and progressing separately.
- A notorious former oil-and-gas waste landfill sits in the dunes **directly south** of the site: took ~70% of offshore waste landed in the north-east in the 1980s; designated contaminated land (with beach and dunes) in 2004; FCC Environment UK remediation approved 2019. Whether it constrains the data centre's developable area is unknown.

## Operator / tenant
None named. TechRE is a consultancy/development manager, not an operator; the press release pitches to "the world's biggest AI names".

## Corporate structure (Companies House)
- Ashfield Land Limited (04363855), group parent, Bristol.
- Ashfield Land (Aberdeen) Ltd (09634263, inc. 2015, active, SIC 68100) — probable Blackdog vehicle, unconfirmed.
- TechRE: TECHRE DATA CENTRES LIMITED (SC724371, inc. 2022) and TECHRE CONSULTING LIMITED (SC597436, inc. 2018), both Edinburgh — which is party to the venture unconfirmed.
- No "Blackdog data centre" SPV found. Blackdog Land (Aberdeen) Limited (SC458222, PSCs A.B. & J. Thow) is a name-match lead only.

## Geo
Coordinates 57.228, -2.078 are an approximate centroid of land east of the A90 around the former rifle range (derived from the application address and village location) — precision "approximate". No published red line for the 200 acres, so no boundary.geojson.

## Not produced
- energy_estimates.json / water_estimates.json — no PUE, GWh, cooling or water data published.
- geo/ — no defensible polygon.

## Follow-ups
1. Inspect APP/2016/0766 on the Aberdeenshire portal when reachable: decision notice date, conditions, s75, red line; check for lapse/renewal and any MSC applications.
2. Watch for a PAN / EIA screening for the data centre (a 600 MW campus would almost certainly be a major EIA development requiring a fresh application and PAN).
3. FOI/NESO connections register check for any Blackdog/Ashfield/TechRE connection agreement.
4. Confirm which TechRE entity and which Ashfield entity are contracting parties; watch Companies House for a new SPV (note BLACKDOG INDUSTRIAL LTD SC887706, inc. 27 April 2026 — same week as the announcement; ownership not yet checked).
5. Belhelvie Community Council position; P&J coverage (paywalled/blocked this session).
