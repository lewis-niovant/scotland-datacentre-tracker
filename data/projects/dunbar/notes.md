# Dunbar (West Barns Mains) — research notes

Researched 2026-07-30.

## What was checked

- **East Lothian Council Idox portal** (`pa.eastlothian.gov.uk/online-applications/`): unreachable to all automated requests (HTTP 503 / connection reset) throughout the research session, so the portal record for 25/00008/SCR could not be viewed directly. The council's formal **EIA scoping opinion** (ref EIA/SCOPING/26/02, 30 March 2026) was obtained instead from a copy hosted by APRS and is treated as the primary source. The scoping opinion is a genuine council document (letterhead, internal consultee responses, statutory references).
- **APRS Dunbar page** (aprs.scot/dunbar-dc, published 2026-03-02, modified 2026-04-16): gives the reference 25/00008/SCR labelled "EIA screening", states "The Council has decided that the applicant must do an Environmental Impact Assessment", site 60.2 ha, coordinates 55.985545, -2.522045, developer Thistle Sands Data Ltd, 50 m from homes on Muirfield Road/Home Avenue, capacity not known.
- **Simon Bell briefing** (28 Nov 2025), critique of the applicant's EIA **Screening Report**: summarises the proposal ("TSD Dunbar Data Centre"), three fields, single-storey buildings with height parameters not fixed, substation(s), emergency backup generation, district heating network centre, and **two SPEN grid connection offers** mentioned but with no power-demand figure. The Screening Report itself was not located.
- **Companies House**: Thistle Sands Data Limited, SC850350, incorporated 29 May 2025, registered office 295 Fenwick Road, Glasgow G46 6UH, SIC 63110. Directors: Kenneth Ross (appointed 29 May 2025) and Steve Ruggi (appointed 31 Oct 2025). PSCs: the same two individuals, each 25–50% shares/votes. **No corporate parent, institutional investor or accounts** — a two-person SPV with no visible backers. Related-name companies (Green Thistle Data Ltd SC861696, Thistle Data Capture Ltd SC897421, Thistle Data Ltd 03698393) were noted but no connection was established and none is recorded.
- **News/community**: East Lothian Courier (Cockenzie scrutiny article) confirms developer, "up to 60.2 hectares of greenfield land" and the Facebook group "Opposition to the West Barns Mains Data Centre" with 705 members. Sustaining Dunbar (19 June 2026) calls it a "hyperscale" AI datacentre and reports the local campaign backing a Scotland-wide moratorium call.

## Key findings / stage

- Pre-application, **M1**: EIA screening concluded EIA required (APRS's account; screening opinion document not seen); scoping request received 30 Jan 2026; **scoping opinion issued 30 March 2026**. No planning application, and no PAN, located as of 2026-07-30.
- **No MW capacity figure exists anywhere** — the council's Climate Change Officer and the Bell critique both note the absence of energy-demand information. `capacity_claims.json` records a single `not_disclosed` entry.
- **No economic claims found** (no jobs/investment/GVA figures from any party), so `economic_claims.json` is omitted per the guide. Similarly no quantified energy or water estimates exist, so those files are omitted; water concerns are qualitative (Biodiversity Officer, Spott Burn).
- **Agricultural land**: council scoping opinion (primary) says the site is within **Class 2 and 3.1 prime agricultural land**; campaign material simplifies to "Grade 2". Both recorded in `site.json`.
- **Torness**: the task brief asked about proximity to Dunbar/Torness grid infrastructure. No source connects the project to Torness or names a substation; only the reported "two SPEN grid connection offers" exist. Recorded cautiously in `grid.json`.
- **62.5 ha**: the brief mentioned a possible ~62.5 ha figure; every located source says ~60.2 ha. Listed as an unknown.

## Conflicts

- Screening vs scoping under one reference: APRS labels 25/00008/SCR "EIA screening" while the council document under the same reference is a scoping opinion. Both events are recorded as separate planning_cases entries sharing the reference.
- Scoping table vs officer advice: the opinion's table scopes "Climatic factors" (and soil, water, population) **out**, yet the Climate Change Officer's quoted advice says lifecycle GHG, energy demand, water usage and waste heat "should be scoped into an EIA". The table formatting in the source PDF is ambiguous; both are described in `planning_cases.json`.

## Could not verify / follow-ups

1. Retry the East Lothian portal for: the screening opinion document, any PAN, the Scoping Report, and the applicant name as registered (Thistle Sands Data Ltd vs another entity).
2. Find the EIA Screening Report (Nov 2025) — would give the parameter details and SPEN offer references first-hand.
3. Watch for a PAN / pre-application consultation events (a major development will require a PAN before application).
4. Check NESO connections queue / TEC register for a West Barns/Dunbar demand connection to corroborate the two SPEN offers.
5. Landowner identity and any option agreement (West Barns Mains farm).
6. First accounts of Thistle Sands Data Ltd (due 2027) and any charge registrations for evidence of funders.
7. Facebook group content (login-walled) for objection counts once an application is lodged.
