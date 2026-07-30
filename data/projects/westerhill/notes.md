# Westerhill (Bishopbriggs) — research notes

Researched 2026-07-30.

## What was checked

- **East Dunbartonshire Idox portal** (working domain is `planning.eastdunbarton.gov.uk`, not `planningapplications.…` which does not resolve). Keyword search via GET returns no results (session-based), but direct case pages were retrieved:
  - **TP/ED/25/0245** — EIA Screening Opinion for the data centre campus, received/validated 29 Apr 2025, decision **EIA Required** issued 8 Jul 2025.
  - **ENQ/ED/2025/00075** — ECU consultation on EIA Screening Opinion **EDC00006158** (the BESS/s36 element), received 15 May 2025, decision **EIA Required** 8 Jul 2025.
  - **TP/ED/25/0428** — PAN, "Erection of an AI data centre with 300MW demand utility capacity with ancillary BESS (to be consented via separate S36 application to the ECU)…", received 1 Aug 2025, validated 26 Aug 2025, status Decided/"Closed" 16 Sep 2025.
- **ECU register** (energyconsents.scot): returned "unexpected error" pages during research; no Westerhill/Apatura s36 application found via searches. Only the ECU screening consultation (via the council case) evidences the s36 route.
- **Apatura consultation site** (consult.apatura.energy/westerhill) and the August 2025 exhibition **panels PDF** (extracted in full): 300MW campus + 500MW BESS; buildings A/B/C1/C2 labelled 80/64/48/48MW (sum 240MW) with 30 data halls total; three BESS areas, substation, district heating building; Lambhill substation connection; NESO grid offer accepted June 2025; closed-loop water cooling; partially Green Belt; adjacent to Antonine Wall WHS buffer zone; timeline to 2029 operation. Panels contain internal inconsistencies (one board says construction starts 2026 and planning decision Q1 2026; website timeline says submission Q1–Q2 2026, construction 2027; two benefit boards say "NORTH LANARKSHIRE" in the heading — copy-paste error from Apatura's Ravenscraig material, figures otherwise identical to the East Dunbartonshire board).
- **Companies House**: applicant SPV **Apatura DC Project 6 Ltd** (16044735), incorporated 28 Oct 2024, Altrincham registered office, electricity SIC codes; one of ≥12 numbered Apatura DC SPVs.
- **APRS** page (retrieved in full): lists the portal references and coordinates 55.920970, -4.189606; last checked by APRS 23 Feb 2026 and still "pre planning". Its headline "200MW" conflicts with the 300MW it cites elsewhere — preserved as a conflicting capacity claim.
- **Foxglove** Dec 2025 report (extracted): Westerhill counted at 300MW in a 2,000–3,000MW Scottish pipeline.
- **EDC Westerhill Regeneration Area** pages: masterplan adopted as planning guidance under LDP2 on 26 Sep 2024; c.300 ha area; £46.77m Place & Growth Programme (Glasgow City Region City Deal); Westerhill Development Road (ex-Bishopbriggs Relief Road phase 5) in planning and intended as site access.

## Conflicts / cautions

- **300MW vs 240MW vs 200MW**: PAN says "300MW demand utility capacity"; building labels sum to 240MW; APRS headline says 200MW. Recorded as separate claims.
- **Jobs figures (2,157 construction / 1,730 operational, annual) explicitly combine direct and indirect** jobs; consultant unnamed ("independent economic analysis performed by:" with the logo not extractable from the PDF text layer). Classified as `total_jobs_unspecified`, modelled.
- Grid "offer accepted"/NESO agreement is developer-stated only; not verified against any NESO/TEC register.
- Site addresses vary: "Land Adjacent To Crosshill Road" (portal), "Land East of Crosshill Road … G66 4SR" (PAN notice), "land South and West of Crosshill Road" (screening). Same masterplan area; exact red line not published in an extractable form, so no boundary.geojson (masterplan graphic only).

## Could not verify / follow-ups

1. Whether a **full planning application** has now been submitted (developer target Q4 2025–Q2 2026; nothing found to 30 Jul 2026) — re-run portal check (needs session-based search or ask EDC).
2. Whether an **s36 application** for the 500MW BESS has been lodged — re-check ECU register when it is working; screening ref EDC00006158.
3. Site area (ha), landownership, red-line boundary.
4. Council formal position, committee reports, community council responses (Bishopbriggs CC, Lenzie CC).
5. Identity of the economic consultant and methodology; identity of technical studies consultants (logos not in text layer).
6. Any TEC/NESO connections register entry corroborating the 300MW connection at Lambhill.
