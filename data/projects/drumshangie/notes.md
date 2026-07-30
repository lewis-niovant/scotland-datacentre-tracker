# Drumshangie / East Airdrie data centre — research notes (2026-07-30)

## What was checked

- **APRS project page** (aprs.scot/drumshangie-dc): the anchor lead. Gives both PAN refs — **24/01025/PAN** (2024) and **26/00069/PAN** (new, 2026) — PAN submitted 19 Jan 2026, accepted 2 Feb 2026, PPP intended summer 2026; EIA screening done, **EIA not required**; coordinates 55.888866, -3.941682; "grid application submitted for 500MW"; brownfield ex-opencast; Stanrigg disaster site within the area; site for sale (Shepherd particulars).
- **North Lanarkshire ePlanning portal**: **unreachable** from the research environment (TLS connection reset via proxy; WebFetch 503) on 2026-07-30. Neither PAN could be verified against the primary record — this is the main gap, hence `verification_level: reported`.
- **Shepherd Chartered Surveyors sale particulars** ("Digital/Data Centre & Manufacturing Campus, East Airdrie", ML6 7TD): 117.21 ha (289.63 acres), >1.2M sq ft total floorspace, PAN 24/01025/PAN submitted 9 Oct 2024, grid connection application 21 Oct 2024 for **500MW planned demand**, uses incl. data centres, gigafactory, BESS. This is the provenance of the 500MW claim — a landowner-side connection application, not a developer design figure.
- **DCD article (June 2025, read via BeBeez republication; DCD 403-blocked)**: background that a data centre permission at the former Drumshangie Mine was **granted in 2012** but never built; **2024 filings by "an affiliate of UK potato-supplier Albert Bartlett"** (data centres, offices; some filings referenced energy-from-waste). Also profiles Apatura (Ravenscraig 550MW/£3.9bn, five central-belt "AI-ready" sites, "founded 2014" claim, CEO Giles Hanglin, ex-Google hire Michael Hunter).
- **East Airdrie EIA NTS (July 2024, Albert Bartlett Ltd)** on docs.planning.org.uk: for a *separate* mixed-use PPiP (up to 3,000 homes + industrial/retail on 383.27 ha of the same landholding). Confirms Albert Bartlett Ltd full ownership; LDP 2022 allocations **NLC00520 Data Centre (65.30 ha)** and **NLC00519 Energy Plant (29.52 ha)**; brownfield/historic-mining character with peat and two Drumshangie Moss SINCs; Stanrigg Memorial assessed as visual Viewpoint 7 (slight effects).
- **Companies House**: Apatura Ltd 13948114 (inc. 1 Mar 2022, ex-Green Power Consultants Holding Ltd; Altrincham) ← Felstead Ford Ltd 14552991 (50–75%) ← **Adrian Ashley Hill** (sole PSC, b. Jun 1978) — ultimate beneficial owner. Apatura DC Ltd 16041291 (inc. 25 Oct 2024) plus **Apatura DC Project 1–10 Ltd** SPVs (all inc. 28 Oct 2024) — the site-per-SPV pattern (DC Project 3 Ltd was reported applicant for the relocated ~300MW campus). Albert Bartlett group companies all registered at 251 Stirling Road, Airdrie, adjoining the site.
- **Stanrigg disaster** (Wikipedia, corroborated by Scottish Mining Website/NMRS listings): 9 Jul 1918, peat-moss inrush at Arbuckle Pit, Stanrigg Colliery; 19 dead incl. six teenagers; **11 bodies never recovered — entombed on site**; memorial c.100 m away, centenary event 2018. This makes ground disturbance on the moss exceptionally sensitive.

## Conflicts / cautions

- **"500MW data centre"** is a *grid demand application* figure originating with the landowner's selling agent (Oct 2024), later attached by APRS to Apatura's 2026 proposal. No IT-load, phasing or design figure exists publicly.
- **Apatura "founded 2014"** (press/its own application) vs Companies House incorporation 2022 — recorded as conflicting; CH preferred.
- **Applicant identity**: 2024 PAN attributed to an Albert Bartlett affiliate (landowner side, site simultaneously marketed for sale); 2026 PAN attributed to Apatura by APRS. Exact registered applicants unverified.
- **Development plan**: LDP 2022 allocated a data centre here, but APRS says the latest plan position is mixed use; meanwhile the landowner's own 2024 EIA/PPiP sought 3,000 homes on the wider 383 ha. Competing intentions for the same landholding.
- **Brownfield claim**: real (opencast history) but the site includes Drumshangie Moss peatland/SINCs — recorded as `mixed`.
- BeBeez's page titled "Apatura plans 500MW…" carries the Ravenscraig article text; the DCD original of the same slug may be a later Drumshangie piece — could not be read (403; Wayback also unreachable).

## Not produced

- `economic_claims.json` — no Drumshangie-specific jobs/investment claims found (Apatura's £3.9bn/jobs claims relate to Ravenscraig).
- `geo/boundary.geojson` — no red-line plan retrievable; declined to sketch.
- `energy/water estimates` — nothing published.

## Follow-ups

1. Re-check the NLC portal (24/01025/PAN, 26/00069/PAN, EIA screening ref, the 2012 permission, and any summer-2026 PPP submission) once reachable; upgrade verification_level and add red-line boundary.
2. Identify the applicant entities on both PANs (Albert Bartlett entity vs an Apatura DC Project SPV) and any land transaction/option.
3. Check NESO/SPEN connection queue data for a 500MW demand application at East Airdrie and its Gate 2 status.
4. Watch for community-council/resident responses once the PPP is lodged; the Stanrigg entombed-remains issue is likely to be central.
