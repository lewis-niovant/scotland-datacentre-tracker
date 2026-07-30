# Wester Hermiston — research notes (30 Jul 2026)

## What was checked

- **Council primary record**: The Edinburgh Idox portal (citydev-portal.edinburgh.gov.uk) reset TLS connections for all automated access attempts, so portal pages could not be read directly. The best primary source obtained is the **Development Management Sub-Committee report of 25 March 2026 on PAN 25/03978/PAN** (official CEC paper, hosted as a copy by APRS), which contains the site history, references and key issues.
- **APRS campaign page** (hermiston-dc), which links the portal record (keyVal SXDBH8EW0GY00) and hosts four Cundall background papers obtained via FOI ("missing from the planning portal"): Energy Statement, Operational Energy Statement, GHG Emissions Report (rev P01, 28/11/2025), GHG Addendum. The Energy Statement and GHG Addendum PDFs failed to download intact; the Operational Energy Statement and GHG Report were read in full (some results tables not machine-readable).
- Apatura consultation site (project / benefits / why-now pages), Companies House, Cockburn Association, Bella Caledonia, Change.org petition, Scotsman/Yahoo coverage, DPEA search.

## Key finding — status correction

The task brief said "application validated ~19 Dec 2025". **The council committee paper shows that what was validated on 19 December 2025 is the *second EIA screening request* 25/05576/SCR ("under consideration"), not a full planning application.** The first screening 25/02924/SCR was determined **EIA not required on 7 July 2025**. The full application was still "forthcoming" as of the 25 March 2026 committee report, and no validated FUL could be located by 30 July 2026 (developer timeline targeted Q1–Q2 2026 submission, decision Q3–Q4 2026). Status is therefore **pre_application / M1**. A search-engine summary attributed "25/03863/FUL registered 25/07/2025" to this scheme; this predates the PAN and could not be verified anywhere — treated as unreliable and excluded.

## Conflicts preserved

- **Site area**: council committee paper = 24 ha agricultural field; Cundall GHG report = "77-acre site" (~31.2 ha); petition = "over 30 hectares". Possibly red-line vs wider landholding. Recorded council figure in site.json with the conflict noted.
- **Capacity**: 200 MW (PAN description, developer) vs "200–250 MW" (Bella Caledonia). Building MW labels (48+48+36 = 132 MW) recorded as an inferred IT-load-type figure.
- **Jobs**: "245 jobs in Edinburgh" appears only in press coverage; the developer benefits page gives money figures but no job numbers or categories. Recorded as total_jobs_unspecified, reported.

## Corporate

SPV **Apatura DC Project 11 Ltd** (16470100, inc. 23 May 2025, Altrincham; SIC 63110), PSCs Apatura DC Ltd (16041291, ≥75%) and Adrian Ashley Hill. Companies House shows at least 12 "Apatura DC Project N Ltd" SPVs plus Apatura battery entities. (Brief anticipated "Project N" — it is Project 11.)

## South Gyle relationship

The other Edinburgh hyperscale proposal (Shelborn / Shelborn Drummond Ltd, 210–212 MW PPiP at 1 Redheughs Avenue, former RBS HQ) was **refused** by the DM Sub-Committee on 4 Feb 2026 against officer recommendation (NPF4 policies 1 & 2, City Plan Place 19) and is **at appeal**. The refusal debate centred on the undefined "green data centre" concept — the same test Wester Hermiston must meet to qualify as an NPF4 national development. Both schemes prompted the council's June 2026 request for a Scottish Government moratorium. No repo project exists for South Gyle, so no related_project_slugs set.

## Could not verify / follow-ups

1. Whether a FUL has now been submitted/validated — check portal (25/03978/PAN keyVal SXDBH8EW0GY00) and weekly lists when reachable.
2. Outcome of screening 25/05576/SCR (was still pending; APRS "no action as yet" at 23 Feb 2026).
3. NESO June 2025 grid agreement — developer statement only; check TEC register for a Currie-area 200 MW demand connection.
4. Building heights (m), red-line boundary, landowner, water figures (Cundall sustainability report ADC-CDL-XX-XX-T-SY-70221 not located), economic analysis authorship.
5. Whether the application will be notified to Scottish Ministers / handled as a national development.
6. geo/boundary.geojson deliberately omitted — only an indicative layout image exists; no defensible polygon.
