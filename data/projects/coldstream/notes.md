# Coldstream (The Laundry Field / Stainrigg Mains) — research notes

Researched 2026-07-30.

## What was checked

- **Scottish Borders Council Idox portal** (`eplanning.scotborders.gov.uk/online-applications/`): returned HTTP 503 throughout the session. Used the **PlanIt API** (`planit.org.uk`) as the sanctioned fallback. A keyword search for "data centre" across Scottish Borders returned exactly one Coldstream-area record: **25/00556/SCR — "Erection of data centre campus", The Laundry Field BESS, North and East of Stainrigg Mains Farm, Coldstream** — received 2025-05-07, decided 2025-07-04, PlanIt status "Permitted" (i.e. the screening opinion was issued; outcome per press: **EIA not required**). Parish: Leitholm, Eccles & Birgham Community Council. Same search surfaced the separate Duns/Longformacus "Southside" project (25/01835/SCR, 26/00809/PAN, 26/01031/SCO) — a different project, not recorded here.
- PlanIt searches for "Stainrigg", "Coldstream", "Laundry Field" oddly returned nothing (PlanIt keyword search appears to match description text only, not addresses); "data centre" was the working query.
- **Press**: Border Telegraph / Scottish Farmer (Newsquest, ~9 July 2025) covered the screening outcome (planner Scott Shearer; site "vast" but EIA not required; no SSSI within 5 km affected). Data Center Dynamics (~14 July 2025, direct fetch blocked 403, content recovered via search excerpts) gave the technical detail: SPV **Apatura DC Project 3 Ltd**, 69 ha greenfield, up to 70,000 sqm of buildings, **300 MW** data centre, **500 MW BESS**, on-site substation, roof-mounted solar, ~3-year build; full applications not yet submitted at that date.
- **Companies House**: Apatura DC Project 3 Ltd, no. **16044768**, incorporated 2024-10-28, 3rd Floor 1 Ashley Road, Altrincham WA14 2DT — one of a numbered SPV series (Projects 1–12+) at the same address under Apatura Ltd (13948114). Note: the brief suggested "Apatura DC Project N Ltd"; DCD names **Project 3** for Coldstream. Not confirmed from primary documents.
- **Foxglove** report (2025-12-02, PDF parsed locally): lists "The Laundry Field", Land N. & E. of Stainrigg Mains Farm, Coldstream, 300 MW, Apatura, Scottish Borders; no emissions data for this site.
- **APRS**: data centre map pages would not render via fetch (JS-loaded); their coverage captured via Border Telegraph article on the map launch.
- **Apatura website**: no Coldstream project page exists (unlike Larbert); only generic portfolio claims.
- **Geolocation**: Nominatim places Stainrigg Mains at 55.6808, -2.3551 (TD12 4LZ). Recorded site centroid 55.684, -2.351 (offset N/E of the farm per the address), precision `approximate`. **No boundary polygon written** — no red-line plan retrievable.

## Border / Till valley

The site is ~5 km north of the River Tweed, which forms the England border at Coldstream. The Till valley and its landscape lie across the border in Northumberland; the proposal was covered by the Northumberland Gazette (fetch blocked, 403), indicating cross-border interest, but no specific Till-valley landscape objection was located. Note the EIA screening did not consider cross-border visual effects in any material we could retrieve — the screening documents themselves were not accessible.

## Conflicts / ambiguities

1. **Current status**: DCD (July 2025) said full applications not yet submitted; a Border Telegraph piece (~early 2026) said "the planning application is still to be decided upon" for Coldstream — possibly loose wording for the pending future application, possibly a lodged application we could not find. PlanIt showed **no PAN, SCO or full application** for the site as of 2026-07-30. Status recorded as `screening` / M1.
2. **"The Laundry Field BESS"** in the portal address line suggests a pre-existing or parallel BESS scheme on the same land (Apatura is primarily a BESS/grid developer). A separate BESS application was not searched for by name beyond "Laundry Field" (no results); worth checking the portal directly when it is back up.
3. **300 MW provenance**: developer figure via journalism; IT load vs grid import unspecified. Foxglove repeats it from the portal record.
4. **SPV attribution** (Project 3) rests on DCD only.

## Follow-ups

- Retry the Idox portal for 25/00556/SCR documents (screening request + officer's screening opinion) — would confirm applicant SPV, red-line boundary, exact areas, generator fuel details.
- Search portal/PlanIt periodically for a PAN or full application (also under applicant "Apatura" or agent names); check SBC weekly lists.
- Check for a separate Laundry Field BESS application and any SPEN/NESO connection-queue entry near Eccles/Coldstream.
- Ask Leitholm, Eccles & Birgham Community Council minutes for local response once an application is lodged.
