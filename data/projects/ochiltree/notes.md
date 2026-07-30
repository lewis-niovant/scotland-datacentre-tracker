# Ochiltree / Creoch Farm data centre campus — research notes (2026-07-30)

## What was checked
- **East Ayrshire ePlanning portal** (`eplanning.east-ayrshire.gov.uk/online/`): returned HTTP 503 throughout the session, as anticipated. All portal facts were therefore taken from the **PlanIt API** scrape of the portal (planit.org.uk), which carries the full record metadata including keyVal URLs, dates, decisions and agent details.
- **PlanIt API queries** across East Ayrshire for "data centre", "Creoch", "Killoch", "Ochiltree", "BESS", "screening", "scoping", "PAN": found
  - `25/0003/EIASCR` — EIA screening request for a Data Centre Campus, Land South of Creoch Farm, Ochiltree, Cumnock KA18 2QH. Received/validated 2025-06-03; delegated decision **"EIA required" issued 2025-07-14**. Agent AAH Consultants, York. Portal point 55.460976, -4.409163. 3 documents on file (not retrievable due to 503).
  - `25/0002/S36SCR` — Section 36 screening request (via Scottish Government Energy Consents Unit) for a **200 MW BESS, Land Adjacent Killoch, Ochiltree**; received 2025-01-23; council response 2025-02-12 "EIA required". Applicant not named in the scrape.
  - `25/0001/S36SCR` — separate **150MW Westport BESS** (RES) on land at Killoch KA18 2QH; screening 2025-01-22, EIA required 2025-02-12. Context/cumulative only — distinct developer and scheme.
  - **No PAN, no EIA scoping request, no planning application** for the data centre found on the register up to the latest PlanIt scrapes (checked to 2026-07-30). Note: `25/0008/PREAPP` (data centre, Purroch Farm, Hurlford) is a **different project** elsewhere in East Ayrshire — do not conflate.
- **APRS** (`aprs.scot/ochiltree-dc/`): confirms reference, "EIA will be required", developer Apatura, 200MW / 24.5 ha / 45,000 sqm, coordinates 55.457124, -4.412888, and hosts a mirror of the screening request PDF (`25_0003_EIASCR-PROPOSED_CONSTRUCTION_OF_DATA_CENTRE_CAMPUS-1280790.pdf`). Direct download was blocked by the site's captcha; content could not be read first-hand.
- **Trade press**: DCD article (June 2025; 403 to fetcher) read via BeBeez syndication: SPV **Apatura DC Project 12 Ltd**; 24.5 ha agricultural land south of Creoch Farm, just north of the former Killoch Colliery; up to 200MW IT load; c.45,000 sqm in one or more 1–2 storey buildings; roof-mounted solar; new on-site substation and underground cable to **Killoch Substation <0.5 km southeast**; ~3-year build; **no end user named**; prior 200MW BESS application for the site; first reported by the Cumnock Chronicle.
- **Companies House**: APATURA DC PROJECT 12 LTD, no. 16470093, incorporated 2025-05-23 (eleven days before the screening request), SIC 63110, registered 3rd Floor 1 Ashley Road, Altrincham WA14 2DT alongside Apatura DC Project 1–11 Ltd. PSC/parent chain not captured.
- **Community**: searched for Cumnock Chronicle / community council / objection coverage — nothing site-specific found beyond APRS monitoring. Consistent with the scheme not yet reaching statutory pre-application consultation.
- **Foxglove "Scotland planned data centres" PDF** (Dec 2025): fetched copy did not mention Ochiltree/Apatura — no usable energy/water estimates. No published energy, water or economic figures for this site, so `energy_estimates.json`, `water_estimates.json` and `economic_claims.json` are deliberately omitted.

## Conflicts / uncertainties
- **Coordinates**: APRS (55.457124, -4.412888) vs portal point via PlanIt (55.460976, -4.409163) — ~400 m apart. Recorded 55.4571, -4.4129 with `location_precision: approximate`; no boundary polygon published (red-line plan not obtainable), so no `geo/boundary.geojson`.
- **BESS attribution**: DCD says a 200MW BESS application "had previously been filed" for the site; Westport project material refers to a "Creoch Farm BESS" adjacent; the register scrape for 25/0002/S36SCR does not name the applicant. Recorded as `reported`, not attributed firmly to Apatura.
- **200MW provenance**: consistently described as **IT load** in the screening request (per press and APRS); no independent grid-connection record (NESO/TEC register not checked against a confirmed connection name). Grid "secured" language is Apatura portfolio-level marketing only.
- **Coal legacy**: the site itself is reported as agricultural land *north of* the former Killoch Colliery — the "former coal site" framing in some briefs overstates it; the colliery land proper hosts separate proposals (Westport BESS, soil treatment centre screening 25/0004/EIASCR).

## Follow-ups
1. Re-try the East Ayrshire portal for the three documents on 25/0003/EIASCR (screening request, plan, screening opinion letter) — would give applicant confirmation, red-line boundary, cooling/water statements and the council's reasoning.
2. Watch for a PAN / EIA scoping request (screening opinions effectively lapse if no application follows; EIA required means a PAN + 12-week pre-application period is needed for a major application).
3. Check ECU portal for the 25/0002/S36SCR "Creoch Farm/Killoch" BESS applicant identity and status.
4. Check NESO TEC/connections registers for a Killoch-connected demand or storage entry matching Apatura.
5. Companies House PSC filings for Apatura DC Project 12 Ltd parent/ownership.
