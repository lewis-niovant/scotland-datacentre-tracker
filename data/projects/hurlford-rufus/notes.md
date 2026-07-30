# Research notes — Rufus data centre, Purroch Farm, Hurlford (East Ayrshire)

Researched 2026-07-30.

## What was checked

- **East Ayrshire Idox portal** (`eplanning.east-ayrshire.gov.uk/online/`): returned HTTP 503 to all direct fetch attempts on 2026-07-30. The record was instead confirmed through the PlanIt aggregator (which scrapes the portal) and APRS, both of which link the same portal URL and reference.
- **Planning record found: 25/0008/PREAPP** — Proposal of Application Notice, "Data centre complex including data halls, substation, new road access, balancing pond, security, associated development, landscaping, new trees, wildflower meadow (major application)", Land at Purroch Farm, Mauchline Road, Hurlford, KA1 5JJ. Received/validated 2025-11-10; recorded outcome "Approved with Conditions" (delegated) on 2025-11-25 — for a PAN this is acknowledgement of the notice, not a permission. Two documents on the portal (not retrievable due to 503). Idox keyVal `T5KFT0GF01U00`.
- **No other Purroch/Rufus records** on PlanIt for East Ayrshire: no EIA screening/scoping request and **no full application** as of PlanIt's last scrape (2025-12-11) or in any press/campaign source to 2026-07-30. (For comparison, sister site Cato in Fife had its full application submitted June 2026 — Rufus appears to be behind Cato in the pipeline.) The instruction's premise that "an application has been lodged" resolves to this PAN, which press loosely described as an application "awaiting determination".
- **Companies House**: SPV **ILI Rufus Limited, SC825440**, incorporated 2024-10-10, active, SIC 41201, registered at ILI Group's Hamilton office. Parent: Intelligent Land Investments Group plc, SC564296. Officers/PSC not captured (overview page only). Note SPV pre-dates the public launch by a year.
- **SPICe**: SPICe Spotlight blog "Data Centres" (2026-06-26) — describes Rufus as "badged as 540MW", MW = maximum instantaneous draw. This is the "SPICe 540 MW" provenance: SPICe is repeating the developer badge figure, not validating it.
- **Developer material**: ILI Stoics page (no per-site figures; claims secured grid connection, land rights, renewables, heat recovery) and the Rufus consultation microsite (meetings.ili-energy.com) — consultation events 24 Feb (Kilmarnock), 3 Mar (Hurlford), 11 Mar (Galston) 2026; "hundreds of jobs during construction"; community offers (school transport, defibrillators, local funding).
- **Journalism**: BBC (Jonathan Geddes, 1 Mar 2026 — accessed via nuclear-news.net repost; BBC original and Yahoo syndications not retrievable): ~100 ha (250 acres) near HMP Kilmarnock; Alex de Vries/Digiconomist estimate ~6bn litres freshwater/yr; resident quotes. Yahoo/GlasgowLive-derived piece: 540MW, £15bn Stoics, first phase online by 2027, Logan Energy Project Management involvement. BDC Magazine: Stoics launch 4 Nov 2025, Mark Wilson quote.
- **Campaign material**: APRS project page (links portal ref, developer page, local campaign); Ayrshire Major Development Community Group site (540MW "base... before any future expansion"; concerns re scale, EIA absence, water, engagement).

## Conflicts and caveats

- **Status conflict**: some press implies a lodged application "awaiting determination"; the only record is a PAN. Treated as pre_application / M1.
- **540MW metric undefined** — recorded as separate claims (developer unspecified; SPICe grid-import interpretation). No grid document found.
- **100 ha site area** is journalistic only; no red-line plan retrievable, so no `geo/boundary.geojson` (would not be defensible).
- BBC quotes sourced via a campaign-blog repost — re-verify against bbc.co.uk when reachable.
- Agricultural land class, heights, footprints, phases, cooling, applicant identity on the PAN: all unpublished — listed in `project.unknowns`.

## Follow-ups

1. Re-check the Idox portal (503 on 2026-07-30) for the two PAN documents and any new full application / EIA screening or scoping request (likely mid/late 2026 given the March consultations and 12-week PAN rule).
2. Pull ILI Rufus Limited officers/PSC filings; confirm applicant name and agent (agent address on PAN: Inverlair Farm, Tulloch, Roy Bridge PH31 4AR).
3. Check NESO connections queue / SPEN data for a Purroch/Hurlford connection to test the "secured grid connection" claim.
4. Locate the BBC original article URL and the East Ayrshire Council response, plus any community council minutes (Hurlford & Crookedholm CC).
5. When the full application lands: red-line boundary, LCA class, EIA, heights/footprints → update site.json and add geojson.
