# Research notes — Aurelius (North Lanrigg, Newhouse/Cleland, North Lanarkshire)

Researched 2026-07-30.

## What was checked

- **North Lanarkshire Council Idox portal** (`eplanning.northlanarkshire.gov.uk`) was unreachable from this environment (connection failed), so the **PlanIt API mirror** was used as the primary route to the council record. PlanIt returned 14 recent "data centre" applications in North Lanarkshire.
- **Identification of the Aurelius records.** Two candidate PANs exist in the Newhouse area and are easily conflated:
  - `25/00989/PAN` — Land At North Lanrigg, Carlisle Road, Cleland ML1 5LT (received 2025-09-12; applicant address "F.A.O. Simon Munro, 33 Bothwell Road, Hamilton ML3 0AS" = ILI Group's registered office). **This is Aurelius.** Confirmed by the ILI Aurelius Limited public-exhibition notice on the Public Notice Portal for "Land at North Lanrigg, Carlisle Road" (exhibitions 21 Oct and 4 Nov 2025, Salsburgh Community Centre, comments to gt@ili-energy.com by 26 Nov 2025), and by DCD-derived reporting that "ILI has filed to develop a 400MW data center campus on Carlisle Road in Cleland".
  - `25/01328/PAN` — South Lanridge Farm, Linrigg Road, Newhouse ML1 5ND (received 2025-12-17). STV (12 Jan 2026) reports the applicant is **HFD Renewables NL** — a separate scheme ~0.9 km east, also with substation and BESS. Recorded in sources as a disambiguation entry only.
- **EIA screening**: `26/00595/EIASCR`, "Data Centre Campus Including Grid Connection", same North Lanrigg address; received 2026-05-11, validated 2026-06-03, **undetermined** as of PlanIt's 2026-07-28 scrape, target decision 2026-08-03. Three documents are listed but could not be opened (portal down), so nothing is known about the screening report's site area, floorspace or the council's view on EIA.
- **Companies House**: ILI AURELIUS LIMITED, SC825293, incorporated 9 Oct 2024, active, registered at 33 Bothwell Road, Hamilton ML3 0AS, SIC 41201 — sibling of ILI Cato Ltd and ILI Rufus Ltd (SC825440). Parent Intelligent Land Investments Group plc SC564296.
- **Capacity**: 400MW is a developer badge figure from the 4 Nov 2025 "Stoics" launch, repeated by DCD, Data Centre Review (network breakdown Cato 600 + Rufus 540 + Aurelius 400 ≈ 1.5GW) and APRS. No planning or grid document defines the metric. First phase 50–100MW "online by 2027" is a network-level claim.
- **APRS page** (`aprs.scot/newhouse-dc/`) was captcha-gated to direct fetch (and web.archive.org is blocked from this environment); its content — "400MW data centre on Green Belt farmland at Newhouse between Chapelhall and Holytown... pre-application... developer ILI" — was captured via search-engine snippets. Same for the Public Notice Portal notice (direct URL now 404s).
- **DCD article** on the Stoics returned HTTP 403 to fetch; used via snippets, tier 4.

## Conflicts / oddities

- **Settlement naming**: planning address says *Cleland*; APRS says *Newhouse*; datacentermap says *Newarthill*; exhibition notice says *Motherwell ML1 5SU* (portal: ML1 5LT). The site sits between these settlements (Fortissat ward). Slug follows the brief ("newhouse-aurelius").
- **Green belt**: asserted by APRS and consistent with area-level reporting ("280 acres... mainly on green belt" for the wider cluster), but not verified against the adopted NLC Local Development Plan.
- **BESS**: search results mention an ILI ~200MW BESS at "North Lanrigg Farm, Edinburgh Road, Newhouse" (Section 36/ECU route, and an older 2023 public notice for North Lanrigg exists). The Aurelius PAN does not mention BESS (unlike the HFD PAN). Relationship left as an unknown.
- **Timeline claim** ("PAN agreed Nov 2025, applications possible from 5 Dec 2025", datacenters.com) is roughly consistent with the 26 Nov 2025 consultation deadline but not with the portal's PAN dates (Sept 2025); treated as low-reliability and not recorded.

## Not found / follow-ups

- Screening outcome due ~3 Aug 2026 — re-check `26/00595/EIASCR` shortly after that date; read the 3 screening documents when the portal is reachable (site area, floorspace, halls, phasing, grid connection detail should be in the screening report).
- No formal planning application yet (as of 2026-07-30). Watch for a PPP/full application referencing PAN 25/00989/PAN.
- No Aurelius-specific jobs/investment figures, cooling/water information, land classification, or community-council position. No energy/water estimate files were created — nothing to base them on.
- No boundary GeoJSON: no red line or defensible polygon available; only portal point coordinates.

## Cross-references

- Sibling Stoics records: `cato-auchtertool` (M2, application 26/01243/PPP) and `hurlford-rufus` (M1, PAN 25/0008/PREAPP). `related_project_slugs` updated in all three records.
- Sources for this record are in the project-local `sources.json` (per task instruction; the global ledger was not modified). Ids `src-ch-ili-group`, `src-ili-data-centres`, `src-bdc-stoics-2025`, `src-dcr-submission` duplicate entries already present in the global ledger.
