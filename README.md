# Scotland Data Centre Observatory

An independent, evidence-led public resource documenting Scotland's operating, proposed, approved, refused, withdrawn and speculative data-centre developments. Not a campaign site and not an industry promotional site.

## Principles

- **Primary-source first** — planning portals, EIA documents, decision notices, Companies House and government/regulator publications outrank press releases and campaign material.
- **Preserve uncertainty** — every material value carries an explicit state (`confirmed`, `reported`, `developer_stated`, `modelled`, `estimated`, `disputed`, `unknown`, …) and a source reference. Missing fields are never silently filled.
- **Preserve conflicting values** — when sources disagree (e.g. developer says 600 MW, planning application says 400 MW), all claims are retained side by side with a stated preferred interpretation and rationale.
- **No false precision** — derived figures (household equivalents, football pitches) disclose their assumptions and can be switched off.

## Repository layout

```
data/
  schema/            JSON Schemas for every record type
  registry.json      Provisional project registry (research triage)
  constants.json     Disclosed comparison constants & national context figures
  briefing.json      Source-backed national updates shown on the public overview
  sources/sources.json   Global source ledger (reliability-tiered)
  projects/<slug>/   One folder per canonical project:
    project.json, site.json, capacity_claims.json, energy_estimates.json,
    water_estimates.json, economic_claims.json, planning_cases.json,
    organisations.json, community.json, grid.json,
    geo/boundary.geojson, geo/buildings.geojson, notes.md
scripts/
  validate.py        Schema + referential-integrity validation
app/                 Static web app (Vite + React + MapLibre)
```

## Site boundaries and geometry

Official red-line planning boundaries are held for **19 of the 39 projects**, fetched from Spatial Hub Scotland's "Planning Applications: Official" dataset (Improvement Service) under the **Open Government Licence v3**. Attribution: *Contains information from Spatial Hub Scotland, "Planning Applications: Official" (Improvement Service), licensed under the Open Government Licence v3.0.*

See [docs/GEOMETRY_AND_BOUNDARIES.md](docs/GEOMETRY_AND_BOUNDARIES.md) for coverage, the area reconciliation against previously researched site areas, why the remaining projects have no official boundary, where dashed "area sourced, shape modelled" extents are used instead, and the access recipe for reproducing the fetch.

## Basemap, imagery and terrain

The cartographic basemap is OpenFreeMap (© OpenMapTiles, data © OpenStreetMap contributors). Site close-ups additionally use — all keyless, attributed in the map's attribution control:

- **Satellite imagery** — Esri World Imagery (Esri, Maxar, Earthstar Geographics, and the GIS User Community).
- **Terrain** — Terrarium elevation tiles from the AWS Open Data terrain tiles dataset (Mapzen/Joerd lineage).
- **Surrounding buildings in 3D** — extruded from OpenStreetMap `render_height` values in the basemap's vector tiles, drawn matte grey; indicative data-centre masses are drawn separately from sourced heights and captioned as illustrative.

## Validation

```
pip install jsonschema referencing
python3 scripts/validate.py
```

Checks every project file against its schema, verifies all `src-*` references resolve in the source ledger, slug/folder consistency, and GeoJSON parseability.

## Data snapshot

This is snapshot data, researched and verified manually (snapshot date in `data/constants.json`). It is not auto-updating. Known national data gaps (e.g. the absence of a public register of demand grid connections) are documented rather than guessed at.
