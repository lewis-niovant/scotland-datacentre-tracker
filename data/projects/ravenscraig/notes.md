# Ravenscraig AI Energy Campus — research notes (2026-07-30)

## What was checked

- **North Lanarkshire ePlanning portal** (`eplanning.northlanarkshire.gov.uk/online-applications/`): unreachable from the research environment for the entire session (HTTP 503 via WebFetch; TCP connection reset via curl — likely geo/bot blocking). The reported references **25/00838/PAN** (Proposal of Application Notice) and **25/00556/EIA** (EIA screening) therefore come from secondary sources (APRS campaign page via search index, datacentermap, Bylines) and **must be verified directly** when the portal is reachable. Bylines cites an Idox keyVal `T0BHY2BA0EC00`.
- **Developer material**: apatura.energy announcement (27 June 2025) and consult.apatura.energy/ravenscraig (project page + event page) both retrieved.
- **Statutory pre-application notice** (Public Notice Portal): applicant **Apatura DC Project 2 Ltd**; description "Erection of an AI Data Centre Campus with a 550MW demand utility capacity with ancillary Battery Energy Storage (to be consented via separate Section 36 application to the ECU)…", Land at Ravenscraig Regeneration Area, Wishaw, Motherwell ML1 1NR. Direct fetch 404'd; text recovered via search index.
- **Companies House**: Ravenscraig Ltd = SC192142, PSCs Scottish Enterprise, Wilson Bowden (Ravenscraig) Ltd (04199662 / Barratt group), Tata Steel UK Ltd — each 25–50%. Verified directly.
- **AI Growth Zone**: HLWS1290 (29 Jan 2026) and gov.uk press release designate the **Lanarkshire AIGZ delivered by DataVita + CoreWeave around DataVita's Airdrie/Chapelhall site** (500 MW compute, 1GW+ private-wire renewables, £8.2bn, 3,400+ jobs, £543m community fund). **Ravenscraig/Apatura is not named** in HLWS1290, the NLC welcome release, or DataVita's AIGZ FAQ. Apatura submitted its own AIGZ bid for Ravenscraig to DSIT in June 2025; in October 2025 it was still "awaiting UK Government confirmation". Conclusion: Ravenscraig is **not part of the designated AIGZ** on current official evidence, although some regional coverage (Urban Realm "AI gold rush", ScotlandIS-adjacent summaries) loosely associates "a data campus in Ravenscraig" with the region's AI push. Treat any claim of AIGZ status for Ravenscraig as unconfirmed.
- **Status as of mid-2026**: Data Centre News (11 June 2026, in its Larbert submission story) confirms the Ravenscraig application had **not been filed** and was expected "this summer". Original developer timeline (application Q4 2025, decision Q1 2026) has slipped. Status = pre_application, M1.

## Conflicts preserved

- **BESS capacity**: 650 MW (developer consultation site) vs 600 MW (Bylines).
- **Campus MW**: 550 MW (developer, PAN wording) vs 500 MW (DCD headline).
- **Economic claims**: June 2025 study figures (£1.2bn construction GVA; 16,000+ job-years; £729m annual GVA; 2,399 jobs; +0.4% GDP) vs October 2025 consultation coverage (£766m; £583m; "over 2,000 jobs"). No explanation for the downward revision found; the "independent socio-economic study" consultant and methodology are unnamed. Bylines separately reports only **1,044 permanent jobs** proposed.
- **Investment**: £3.9bn (developer) rounded to £4bn in some press.

## Could not verify

- PAN/EIA references and dates against the portal (blocked); screening opinion text beyond the quoted extract.
- Any NESO/SPEN/Ofgem record of the claimed 550 MW accepted grid offer (Wishaw + Newarthill substations) — developer statements only.
- Companies House record for the SPV Apatura DC Project 2 Ltd (not searched to completion).
- Red-line boundary — no plan retrieved, so no `geo/boundary.geojson` produced; site.json coordinates are an approximate centroid of the eastern Ravenscraig regeneration land (`location_precision: approximate`).
- Water/cooling demand, backup generation, PUE, annual energy — nothing disclosed; no energy_estimates.json produced.

## Follow-ups

1. Re-check the NLC portal (from a UK IP if needed) for 25/00838/PAN, 25/00556/EIA and any new application submitted since June 2026; capture the screening opinion PDF.
2. Check Companies House for Apatura DC Project 2 Ltd and Apatura group structure.
3. Check the Energy Consents Unit portal for the Section 36 BESS application.
4. Watch for the DSIT decision on any second-wave AI Growth Zone or Ravenscraig-specific designation.
5. Obtain the socio-economic study to classify the jobs figures properly (direct vs indirect vs induced).
