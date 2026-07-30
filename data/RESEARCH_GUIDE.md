# Research guide for project records

Every project folder `data/projects/<slug>/` is produced by deep research and must validate against `data/schema/*.schema.json`. Run `python3 scripts/validate.py` before finishing.

## Files per project

Required: `project.json`, `notes.md`. Strongly expected where information exists: `site.json`, `capacity_claims.json`, `planning_cases.json`, `organisations.json`, `sources` entries. Optional if data exists: `energy_estimates.json`, `water_estimates.json`, `economic_claims.json`, `community.json`, `grid.json`, `geo/boundary.geojson`, `geo/buildings.geojson`.

## Rules

1. **Primary-source first.** Locate the council planning portal record (all relevant councils use Idox Public Access — search `…/online-applications/` by keyword/reference). Cite the portal page and key documents. SPICe/government/regulator next; developer material next; journalism next; APRS/campaign material last (lead-generation only).
2. **Every value needs a source.** Add sources to the GLOBAL ledger `data/sources/sources.json` (append — never remove existing entries; ids are `src-<kebab>`; include reliability_tier 1–5, retrieved_date). Reference them via `source_ids`.
3. **Preserve conflicting claims** as separate array entries with `state`, `claimant`, optional `preferred` + `preferred_rationale`. Never average or pick silently.
4. **Never guess.** Missing = omit the field and add to `project.unknowns`. Use `state: "unknown"`/`"not_disclosed"` where a field exists but value is unavailable.
5. **Maturity**: M0 concept/marketed, M1 early development (PAN/screening/scoping/land option), M2 formal application validated, M3 consented and materially progressing, M4 under construction, M5 operational. Flags: refused/withdrawn/lapsed/appealed/paused/superseded. `maturity_explanation` must state the evidence.
6. **Economic claims**: classify category exactly (direct vs indirect vs induced; jobs vs job-years vs FTE; construction vs operational), record claimant, methodology, binding_status. Never record "X jobs" without category.
7. **Coordinates**: WGS84, from planning documents or careful geolocation of the named site; set `location_precision` honestly. For operating/sensitive facilities set `is_sensitive: true` and `location_precision: "coarse_deliberate"`.
8. **Geo**: `geo/boundary.geojson` = red-line or best-effort site boundary polygon (FeatureCollection; property `boundary_precision`). `geo/buildings.geojson` = building footprints with `height` (metres) and `name` properties where layouts/heights are published. If you cannot draw a defensible polygon, omit the file rather than invent one.
9. **notes.md**: research narrative — what was checked, what conflicts exist, what could not be verified, and suggested follow-ups.
10. **Neutral language throughout.** Describe objections and benefits as claims by named parties.
