# Hunterston data centre — research notes (2026-07-30)

## What was checked

- **North Ayrshire Idox portal** (`eplanning.north-ayrshire.gov.uk/OnlinePlanning/`): keyword search "Hunterston" (219 results). Found **26/00138/EIA** — "Request for EIA Scoping Opinion for new data centre", Hunterston Estate, West Kilbride; received 25 Feb 2026, validated 27 Feb, consultation to 13 Mar, **Scoping Agreed 30 Mar 2026** (delegated; case officer Iain Davies; applicant field: Tetra Tech F.A.O. Stuart Murison; keyVal `TB0Y9PLE04X00`). 12 documents on file, including the scoping report (doc 1330826) and consultee responses (Transport Scotland, SEPA, flooding, Scottish Water, EH, roads, HSE, WoSAS, HES, NatureScot). **The PDFs themselves were not downloaded/read** — parameters below come from press and campaign summaries of the scoping report and should be verified against the documents.
- No PAN found on the portal for the data centre; no full application yet (council confirmed this to press in July 2026). Other Hunterston-area applications noted: 26/00419/PP (XLCC-style DRDT facility?), 26/00284/EIA stability island, 26/00307/EIA solar, 26/00308/EIA EV hub at Clydeport — not part of this project.
- **Developer**: eneusenergy.com/hunterston — ~164 acres, Eneus + Revera Energy with Hunterston Estate; Carlyle & GIC back Eneus; transmission connection; closed-loop cooling, initial fill trucked in, Scottish Water Camphill WTW supply confirmed (developer claim); £10bn+ investment; 1,000+ construction jobs; operational jobs "under review"; application 2026, construction 2027/28.
- **Companies House**: Eneus Energy Limited **SC739030** (inc. 22 Jul 2022) and Eneus Energy Holdings Limited **SC466495** (inc. 2013), both Orchard Brae House, Edinburgh. Filings/PSC not examined — applicant entity/SPV unresolved.
- **APRS** (aprs.scot/hunterston-data-centre — direct fetch blocked, content via search excerpts): 88.16 ha, Grade 3 agricultural land north of West Kilbride; ≤300,000 m² footprint over ~30 ha; 35 m heights; "at least 500MW" (their inference); 450 MW BESS consented 2022 and under construction; build 2027–2034.
- **BESS**: ESS News (15 Jun 2026): Revera Energy FID on **400 MW/800 MWh** Hunterston BESS, construction Q3 2026, 400 kV substation underway, TEC-registered; Carlyle-backed. 2022 consent was the Amp Energy "Scottish Green Battery Complex" (s36, Scottish Government, Jan 2022 — hence not on the council portal). **Conflict: 450 MW (APRS) vs 400 MW (Revera)** — recorded as separate claims; possibly consented max vs FID build. ECU reference not located.
- **Community**: Change.org petition (4 Jun 2026, ~3,150 signatures); APRS "Defend your Castle" protest at Clan Hunter gathering; Scottish Greens MSP Cara McKee moratorium call (Irvine Times); Ayrshire Today on WoSAS archaeology concerns.

## Key conflicts / uncertainties

1. **Site area**: 88.16 ha (APRS/scoping) vs "approximately 164 acres" (~66 ha, developer website). Both recorded on site.json; likely scoping boundary vs developable area.
2. **BESS capacity**: 400 vs 450 MW (above). Overlap of the BESS land with the data centre red line unverified.
3. **Land classification**: "Grade 3" is APRS's characterisation; not checked against the scoping report or Hutton land capability mapping, and Macaulay 3.1 vs 3.2 matters for prime-land policy.
4. **Capacity**: no developer MW figure anywhere; "500 MW+" is campaign inference only.
5. **Peel Ports**: no evidence of involvement — the site is Hunterston Estate farmland (greenfield), not Peel's brownfield Hunterston PARC. Sources kept to make that distinction explicit; brownfield-alternative arguments likely to feature in objections.
6. Coordinates are an approximate estate centroid (55.72, -4.87); no red-line published, so no boundary.geojson.

## Follow-ups

- Download and read the scoping report + scoping opinion and consultee responses (esp. Scottish Water, HES, NatureScot, WoSAS) from the portal.
- Watch the portal for the PAN / full application (expected 2026) and for representations counts.
- Locate the Hunterston BESS s36 consent on the ECU register to pin down reference, MW and red line; map overlap with the data centre.
- Companies House filings/PSC for SC739030 and SC466495; identify the applicant SPV when the application lands.
- Fairlie and West Kilbride community council minutes for formal positions.
- Check NESO TEC register for any data-centre demand connection at Hunterston.
