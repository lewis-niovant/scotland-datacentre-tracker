# Site boundaries and geometry

How the Observatory sources site geometry, what is official, what is modelled, what is
missing, and why. Snapshot date 2026-07-30; 39 project records.

Nothing here overrides a per-project record. Where official geometry and researched
figures disagree, both are retained and the disagreement is recorded as an open
question rather than resolved silently.

## 1. What we now have

Official red-line planning boundaries for **17 of 39 projects** (**28 polygon features**
in total, because several projects carry boundaries for more than one planning
reference — e.g. a screening record as well as the substantive application).

Source: Spatial Hub Scotland, "Planning Applications: Official" (Improvement Service),
layer `sh_plnapp:pub_plnapppol`, supplied daily by Scottish planning authorities.
Licence: **Open Government Licence v3**, so redistribution with attribution is
permitted. The site must carry:

> Contains information from Spatial Hub Scotland, "Planning Applications: Official"
> (Improvement Service), licensed under the Open Government Licence v3.0.

Each polygon feature records its `reference`, `local_auth`, `application_type`,
`official_area_m2`, `licence` and `retrieved_date`, and the projects concerned have
`boundary_precision: "red_line_official"` in `site.json`.

### Accepted projects — official primary boundary area

| Project | Primary reference | Official red line |
|---|---|---|
| blackdog | APP/2016/0766 | 39.6 ha |
| cato-auchtertool | 26/01243/PPP | 68.5 ha |
| coldstream | 25/00556/SCR | 67.4 ha |
| datavita-dv4 | 25/01322/PAN | 14.3 ha |
| datavita-dv6 | 25/01328/PAN | 120.2 ha |
| drumshangie | 24/01025/PAN | 235.8 ha |
| dunbar | 25/00008/SCR | 60.2 ha |
| duns-southside | 25/01835/SCR | 146.7 ha |
| killean | 20/00229/PP | 0.4 ha |
| larbert-glenbervie | P/26/0237/FUL | 18.5 ha |
| meygen-caithness | 20/01258/SCRE | 43.0 ha |
| newhouse-aurelius | 25/00989/PAN | 45.2 ha |
| ravenscraig | 25/00838/PAN | 64.2 ha |
| south-gyle | 25/04239/PPP | 5.9 ha |
| west-calder | 0625/PAC/25 | 53.7 ha |
| wester-hermiston | 25/03978/PAN | 25.0 ha |
| westerhill | TP/ED/25/0428 | 33.3 ha |

Where several references matched, the substantive application (full permission or
permission in principle) is preferred over PAN, scoping and screening records; the
lower-ranked features are retained in the same FeatureCollection but flagged
`is_primary: false`.

### Heights and footprints

Separately from boundaries, published **building heights** exist for 6 projects and
**building footprint areas** for 4. Only two projects have both:

| Project | Footprint | Max height |
|---|---|---|
| duns-southside | 81,000 m² | 24 m |
| hunterston | 300,000 m² | 35 m |

Those two are therefore the only projects that support honest 3D massing. Gross floor
area is **deliberately not substituted** for footprint: for multi-storey data halls
GFA ≠ footprint, and extruding a GFA figure as if it were a ground plan would overstate
the built area. This is why Cato-Auchtertool and Larbert-Glenbervie — which have
published floor areas but no footprint — remain flat on the map.

## 2. The area reconciliation

The official red lines are the first independent geometric check on the site areas the
Observatory researched from planning documents, press reporting and developer material.
Comparison of the official primary boundary against the recorded `site_area_m2`:

| Project | Recorded | Official red line | Delta |
|---|---|---|---|
| cato-auchtertool | 25.0 ha (reported/press) | **68.5 ha** | **+174%** |
| meygen-caithness | 20.0 ha | 43.0 ha | +115% |
| drumshangie | 117.2 ha | 235.8 ha | +101% |
| killean | 74.5 ha | **0.4 ha** | **−99.4%** |
| blackdog | 80.9 ha | 39.6 ha | −51% |
| larbert-glenbervie | 22.3 ha | 18.5 ha | −16.7% |
| wester-hermiston | 24.0 ha | 25.0 ha | +4.2% |
| duns-southside | 151.0 ha | 146.7 ha | −2.8% |
| south-gyle | 5.7 ha | 5.9 ha | +2.8% |
| coldstream | 69.0 ha | 67.4 ha | −2.3% |
| ravenscraig | 64.8 ha | 64.2 ha | −0.9% |
| dunbar | 60.2 ha | 60.2 ha | +0.1% |
| datavita-dv4 | — | 14.3 ha | first known |
| datavita-dv6 | — | 120.2 ha | first known |
| newhouse-aurelius | — | 45.2 ha | first known |
| west-calder | — | 53.7 ha | first known |
| westerhill | — | 33.3 ha | first known |

### The close cluster corroborates the research

Six projects — wester-hermiston, duns-southside, south-gyle, coldstream, ravenscraig
and dunbar — land within ±5% of the official red line, and dunbar within 0.1%. These
areas were derived independently of the Spatial Hub dataset, so the agreement is
evidence that the research method reproduces the official record where the official
record exists.

### The outliers

Each outlier has its own explanation, and the explanations differ in evidential status.

**Killean (−99.4%) — a corroboration, not an error.** The Killean record's existing
finding is that the promoted multi-gigawatt campus rests on a single small 2020
consent. The official red line for `20/00229/PP` is 0.4 ha, against a 74.5 ha promoted
landholding. A red line that small is direct documentary support for that finding: the
only consented item is one small building. *Established.*

**Blackdog (−51%) — expected, and consistent with the record.** The matched boundary
belongs to the 2016 mixed-use permission in principle (`APP/2016/0766`), which is a
different and smaller scheme than the roughly 200-acre landholding promoted for a data
centre. The gap is exactly what the record already says: the "consent" cited for
Blackdog is not a data-centre consent. *Established.*

**Cato-Auchtertool (+174%), Drumshangie (+101%), MeyGen-Caithness (+115%) — open
questions.** In all three the official area is larger than the figure we recorded from
press or secondary reporting. A plausible reading is that reported figures describe
developable area or building footprint rather than the full application red line —
Cato's 68.5 ha red line would comfortably contain the 280,000 m² of buildings cited by
SPICe, and red lines routinely include access, drainage, landscaping and grid corridors
outside the developable envelope. That reading is **conjecture pending a documents
check**; it is not confirmed by any source we hold. These three are recorded as open
questions on their project records rather than resolved, and both figures are retained.

## 3. What we still don't have, and why

22 projects have no official boundary. The reasons are not equivalent.

### No planning reference held yet — 12 projects

ai-pathfinder-irvine, chapelcross, clydebridge, cockenzie, dounreay, easterhouse,
edzell, fearn-airfield, gogar, greenock-spango, inchinnan, jawcraig.

These are announcements, strategic opportunities or grid-record-only entries that have
not entered the planning system. No red line exists upstream to fetch. This is a fact
about the projects — most of the pipeline is not yet an application — not a gap in our
research.

### Upstream geometry is a buffered point, not a real boundary — 4 projects

| Project | Authority | Reference | Upstream polygon area |
|---|---|---|---|
| hunterston | North Ayrshire | 26/00138/EIA | 312 m² |
| hurlford-rufus | East Ayrshire | 25/0008/PREAPP | 382 m² |
| ochiltree | East Ayrshire | 25/0003/EIASCR, 25/0002/S36SCR | 397 m² |
| westerhill (screening records only) | East Dunbartonshire | TP/ED/25/0245, ENQ/ED/2025/00075 | 310 m² |

The dataset's own documentation warns that some authorities supply buffered points
rather than true red lines — **East Ayrshire is named upstream as doing so**; the North
Ayrshire and East Dunbartonshire cases above are our own observation from the returned
geometry, not a documented upstream statement. Our fetcher rejects any polygon under
1,000 m² rather than publish a fake 20 m square as if it were a site boundary. This is an
**upstream data-quality issue** worth raising with the authorities concerned and with the
Improvement Service: the affected schemes include some of the largest proposals in the
dataset. Note the pattern is per-record rather than strictly per-authority — Westerhill
has a genuine accepted boundary from its substantive PAN reference while its two
screening records are buffered points, so re-running the fetcher as schemes progress is
worthwhile.

### Deliberately excluded as sensitive — 6 projects

datavita-dv1, datavita-dv2, pulsant-south-gyle, iomart-glasgow, brightsolid-aberdeen,
epcc-acf-edinburgh.

These are operating facilities carrying `is_sensitive: true` with
`location_precision: "coarse_deliberate"` under the project's existing policy. Adding an
exact red line would contradict that policy, so the fetcher skips them even though the
boundary is public planning record. This is a **deliberate editorial choice, not a data
gap**, and it is reversible if the policy changes.

### One open lead

**haspielaw**: reference `P/25/0490` returned no match upstream. Investigated further —
South Lanarkshire submits **area-prefixed references** to Spatial Hub (samples returned
include `HM/09/X0163/NEW`, `CL/09/0130`, `EK/09/0114`, `CR/09/0077`, where the prefix
denotes the administrative area — `HM` for Hamilton), not the `P/…` form carried by the
PlanIt mirror we sourced the reference from. A `LIKE '%25/0490%'` search across South
Lanarkshire returned nothing, so the record may also simply not be published as a
polygon. Resolving this needs the authority's own reference for the Haspielaw screening
(likely of the form `HM/25/…`). Listed as an open lead, not a conclusion that no
boundary exists.

This is a general caution for future fetches: **reference formats are not consistent
between planning portals, aggregator mirrors and Spatial Hub submissions**, so a
no-match is weak evidence of absence.

## 4. Where modelled extents are used instead

For three projects the map draws a **modelled extent** rather than a boundary:
ai-pathfinder-irvine, chapelcross, cockenzie.

The test for using one is deliberately narrow — all three conditions must hold:

1. a site area is sourced (not guessed);
2. location precision is good enough to place a shape honestly (`exact`,
   `site_centroid` or `approximate`);
3. the site is not sensitive.

Derivation: a square of side √(area) centred on the site point. Nothing about the
shape, orientation or edges is researched, so the shapes are drawn **dashed** and
captioned **"area sourced, shape modelled"**. `boundary_precision` honestly remains
`"none"` — no boundary has been researched for these projects, and a modelled square
must not be allowed to read as one. They are generated at build time and are **not
committed** into `data/projects/`, so they can never be mistaken for research output.

**dounreay** and **fearn-airfield** are excluded despite having sourced areas, because
their `location_precision` is `settlement_level`. A ~1.5 km² square drawn around a
settlement-level point would assert a location we do not have.

## 5. Reproducing this

The access recipe took several wrong turns to find, so it is recorded precisely.

| Item | Value |
|---|---|
| WFS endpoint | `https://geo.spatialhub.scot/geoserver/sh_plnapp/wfs` |
| Workspace | `sh_plnapp` — **not** `sh_planapp` |
| Polygon layer | `pub_plnapppol` |
| Point layer | `pub_plnapppnt` |
| Useful attributes | `reference`, `local_auth` |
| Auth | `?authkey=<token>` |
| Reprojection | `&srsName=EPSG:4326` |

- The Spatial Hub token is a **CKAN API token**, but GeoServer will **not** accept it as
  an `Authorization` header — that returns **403**. It must be passed in the query
  string as `?authkey=<token>`.
- `&srsName=EPSG:4326` makes GeoServer reproject server-side from the native
  EPSG:27700, so no OSGB36 maths is needed; coordinates come back as `[lon, lat]`.
- The dataset is large. **Always filter** (`CQL_FILTER` on `reference` and/or
  `local_auth`); unfiltered requests are not a reasonable way to use the service.

`scripts/fetch_boundaries.py` reads `SPATIALHUB_AUTHKEY` from the environment:

```
export SPATIALHUB_AUTHKEY='<your token>'
python3 scripts/fetch_boundaries.py
```

It is **run manually and never in CI**. Boundaries are committed files, so GitHub
Actions builds need no token. The token must **never be committed** — `.env` is
gitignored. The script validates geometry before accepting it (minimum area 1,000 m²,
centroid within 12 km of the researched site point) and prints the area-reconciliation
report reproduced in §2.

PlanIt was also tested as an alternative source. It serves point coordinates only; its
documented `boundary` column does not exist in the responses returned. It is not a
substitute for the Spatial Hub polygons.

## 6. Next steps

Priority-ordered:

1. **Chase the buffered-point records** (North Ayrshire, East Ayrshire, East Dunbartonshire) and the
   Improvement Service — four significant schemes have no usable upstream geometry.
2. **Check application documents for Cato, Drumshangie and MeyGen** to resolve whether
   the recorded areas describe developable area or footprint rather than the red line.
   Until then the discrepancies stay open questions.
3. **Hand-digitise from site-plan PDFs** for high-profile schemes with no planning
   reference — chapelcross, cockenzie, greenock-spango — at roughly 30–60 minutes each,
   recorded as `boundary_precision: "digitised_from_plan"`.
4. **Re-run the fetcher periodically.** The upstream dataset updates daily, and
   pre-application schemes will acquire references over time, so coverage should rise
   above 17 of 39 without further research effort.
