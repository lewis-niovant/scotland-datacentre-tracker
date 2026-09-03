# QA notes — aggregate sanity check and reconciliation

QA pass date: 2026-09-03 (dataset snapshot_date 2026-09-03; 39 project records).
This file documents what the Observatory counts, what it excludes, and why our
totals differ from published references (APRS, SPICe, Foxglove). It is a
methodology note, not a data file; nothing in it overrides per-project records.

## 1. What we count

- **Unit of count**: one record per `data/projects/<slug>/`. 39 records.
- **Representative capacity per project**: the capacity claim flagged
  `preferred: true` in `capacity_claims.json`, excluding claim types
  `battery_storage`, `onsite_generation` and `backup_generation` (those are not
  data-centre demand). Where the preferred claim is a range
  (`minimum_mw`/`maximum_mw`), totals are given as a range. Conflicting claims
  are never averaged; non-preferred claims are not summed. If an explicit
  preferred claim is excluded or non-numeric, the project contributes no MW.
  Where no preference is set, the public interface can fall back to the largest
  non-estimated, non-inferred, non-disputed facility claim.
- **MW figures are heterogeneous by design**: most developer headline figures do
  not distinguish IT load from grid import ("unspecified"); we sum them as
  published and label the buckets. Do not present the totals as IT load.

## 2. What we exclude (and why)

- **gogar** (200 MW, status `unknown`): research concluded there is no distinct
  Gogar scheme — the SPICe "200MW ... Gogor" line is a conflation of South Gyle
  (Shelborn) and/or Wester Hermiston (Apatura), both already counted. Including
  it would double count. The record exists only to intercept future "Gogar"
  mentions.
- **datavita-dv6**: no site-level MW has been published; the APRS 500 MW figure
  is a zone-level inference (Lanarkshire AI Growth Zone) that would double count
  against datavita-dv4 and the zone claim. Excluded from totals.
- **Zone-level claims** (e.g. the AI Growth Zone "500MW of data centre
  capacity", gov.uk/DataVita): recorded on dv4 for context, never summed.
- **Grid connection applications** are totalled in their own bucket, never mixed
  with proposal capacity: a Gate 2 demand application is not a data-centre
  design figure. This covers the five grid-record-only sites and Drumshangie
  (whose only public figure is a landowner-side 500 MW connection application).
- **Projects with no disclosed figure** are counted in project counts but
  contribute 0 MW: cockenzie, dounreay, dunbar, fearn-airfield, haspielaw
  (preferred claim is `not_disclosed`; Foxglove's 250 MW is an estimate we
  retain but do not sum), hunterston (campaign 500 MW inference not summed),
  meygen-caithness.

## 3. Computed aggregates (2026-09-03)

### Counts by status (39 records)
pre_application 12; operating 6; grid_record_only 5; strategic_opportunity 4;
pending 3; announced 2; screening 2; scoping 2; appealed 1; paused 1;
unknown 1 (gogar).

### Counts by verification level
verified 22; reported 10; unverifiable 7.

### Counts by local authority
North Lanarkshire 6; City of Edinburgh 4; Glasgow City 3; Highland 3;
East Ayrshire 2; East Lothian 2; Falkirk 2; North Ayrshire 2; Scottish
Borders 2; South Lanarkshire 2; Aberdeen City 1; Aberdeenshire 1; Angus 1;
Argyll and Bute 1; Dumfries and Galloway 1; East Dunbartonshire 1; Fife 1;
Inverclyde 1; Midlothian 1; Renfrewshire 1; West Lothian 1.

### Development-pipeline capacity (preferred claims; excludes operating, grid-application bucket, and the exclusions above)

**Verified records (14 with a figure):**
cato 600; hurlford-rufus 540; newhouse-aurelius 400; coldstream 300;
larbert-glenbervie 300; westerhill 300; west-calder 250; duns-southside 225;
south-gyle 212.42; ochiltree 200; wester-hermiston 200; datavita-dv4 100–124;
killean 100–600; greenock-spango 150.
**Verified pipeline total: 3,877–4,401 MW** (3,677.42 MW fixed + two ranges).
A further 4 verified active-pipeline records carry no usable facility figure (see §2).

**Reported active records (3 with a figure):** chapelcross 1,000; blackdog 600;
ravenscraig 550. **Reported active-pipeline total: 2,150 MW.** AI Pathfinder
Irvine's 1,000 MW marketing claim is retained but excluded because the project
is now classified `paused` following reported company collapse.

**Active pipeline (verified + reported): ~6.0–6.6 GW** as claimed by developers.
This excludes paused, refused, strategic-opportunity and grid-only records and
is a sum of heterogeneous headline claims, not a forecast.

### Grid-connection-application bucket
edzell 800; easterhouse 500; drumshangie 500; clydebridge 360; inchinnan 180;
jawcraig 180. **Total 2,520 MW** (2,020 MW of it from the five unverifiable
grid-record-only sites known only via APRS's reading of the NESO register).

### Operating estate (6 records, ~69 MW, mixed metrics)
epcc-acf-edinburgh 38 (grid import); datavita-dv1 24 (facility power);
pulsant-south-gyle 3.4 (SC-1 IT load); brightsolid-aberdeen 2 (marketed ultimate
build-out); datavita-dv2 ~1; iomart-glasgow ~1 (directory figures). These mix grid
import, facility power and IT load and should not be presented as one metric.

## 4. Reconciliation with published references

### APRS "~26 proposals"
Our comparable figure remains **27**: 39 records − 6 operating − 1 gogar
(conflation) − 5 grid-record-only sites. Counting the grid-record-only sites
(which APRS maps) gives 32. The residual gap with "~26" is inclusion criteria:
we carry strategic opportunities with no developer proposal yet (cockenzie,
dounreay, fearn-airfield, meygen-caithness) and the paused Irvine scheme;
APRS's count moves as its map is updated. Its 13 August 2026 update described
21 proposals found in local planning portals plus two not yet in those portals.
Differences remain driven by scope: this dataset retains early, strategic,
grid-only and paused records while making their evidence level explicit.

### SPICe (26 June 2026 briefing)
Re-fetched 2026-07-30. Cato: 280,000 m² of buildings, up to 35 m height,
400→4,000 GWh/yr — **matches our cato-auchtertool record exactly**. Scotland
2024 generation 51.8 TWh / 91.5% renewable — matches `constants.json`
`national_context`. SPICe's "200MW ... Gogor area" line is handled by the gogar
conflation record (§2).

### Foxglove (2 Dec 2025 briefing, re-fetched 2026-07-30)
Foxglove found **11 schemes in the planning system (Nov 2025)**; "Total A —
confirmed" 2,012.42 MW; "Total B — estimated" ~3,000 MW (using 250 MW
placeholders for Cato, Rufus, Aurelius, Haspielaw); context: Scotland winter
peak ~4 GW. Cross-check: summing **our** preferred figures for exactly the
seven Foxglove sites that had figures (south-gyle 212.42, wester-hermiston 200,
ravenscraig 550, coldstream 300, west-calder/Freeport 250, westerhill 300,
ochiltree 200) reproduces **2,012.42 MW to the decimal** — our per-site figures
and Foxglove's agree. Our active-pipeline total (~6.0–6.6 GW) is much larger than
Foxglove's ~3 GW because: (a) post-Nov-2025 developments (Cato PPP validated
May 2026 at 600 MW vs their n/a; Larbert 300 MW submitted 2026; Greenock PAN
Feb 2026); (b) we use developer figures for the Stoics (600/540/400 = 1,540 MW)
where Foxglove conservatively assumed 250 MW each; (c) we include announced/
marketed schemes outside the planning system (blackdog 600, chapelcross 1,000,
killean 100–600, with the paused AI Pathfinder claim retained but excluded), which Foxglove's
planning-portal-keyword method deliberately omits. Conversely we sum 0 MW for
Haspielaw where Foxglove estimated 250 MW.

## 5. Verification caveats attached to these totals

- 2,020 MW of the grid bucket and the 1,000 MW Chapelcross and 600 MW Blackdog
  figures rest on secondary sources only (see each record's
  `verification_level` and notes).
- Inverclyde application 26/0136/IC was directly verified on 2026-09-03, moving
  greenock-spango to `verified` and M2/pending. Chapelcross PAN 26/0855/PAN is
  identified through a third-party council-record mirror, so that project
  remains `reported` pending a direct portal check.
- Source-availability check (QA spot-check, 8 records, 2026-07-30): live
  re-fetches confirmed figures for westerhill (300 MW campus + 500 MW BESS,
  developer consultation site), ravenscraig (550 MW + 650 MW BESS, developer
  site), cato (600 MW/£5bn/Gate 2 600 MW, Data Centre Review; SPICe figures),
  datavita-dv4/dv6 (PlanIt case records; gov.uk AIGZ announcement; DataVita
  FAQ 500 MW zone / 2,400 MWh battery), brightsolid (Keysource spec PDF:
  213 racks, 500 kW day-1 → 1 MW final IT per hall, 25 kW peak/rack),
  easterhouse/inchinnan (not re-verifiable: APRS behind captcha; NESO register
  is a landing page — consistent with their `unverifiable` rating). **No
  figure mismatches were found.** DCD and Silicon returned 403 (as during
  original research); the gov.uk AIGZ text says ">500MW of on-site power"
  (generation framing) while DataVita's FAQ says "500MW of data centre
  capacity" — both are recorded, zone-level, not summed.
