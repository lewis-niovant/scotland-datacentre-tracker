# Pulsant Edinburgh campus - research notes

Treated as one campus record covering SC-1 (South Gyle), SC-2 and SC-3, per operator's own grouping of its three Scottish sites, all in west Edinburgh and interconnected.

## What was checked
- Pulsant's own data centre pages (SC-1 South Gyle; datacentres overview listing SC-1/SC-2/SC-3 as the only Scottish sites).
- Directory listings: Data Center Map (SC-1 6.6 MW headline; SC-3 1.6 MW), Baxtel (SC-1: 3.4 MW IT, 600+ racks, 28,524 sqft raised floor), Colo-X (Onyx history).
- Ownership: Antin Infrastructure Partners acquired Pulsant July 2021 (Antin press release).

## Conflicts
- SC-1 power: 3.4 MW IT (operator/Baxtel) vs 6.6 MW (Data Center Map headline, probably gross). Both preserved in capacity_claims.
- SC-2: 1.0 MW vs "2 MW customer load" across listings.
- The briefing figure of ~9.6 MW combined could not be tied to a single public source; individual claims recorded instead.

## Pulsant Glasgow - IMPORTANT
The brief suggested a `pulsant-glasgow` record. Pulsant no longer operates a Glasgow facility: it acquired one via Onyx Group (2016) but that site has since been closed (Colo-X). Pulsant's current site list shows only Edinburgh in Scotland, so no operating record was created; noted here instead.

## Follow-ups
- Confirm SC-2/SC-3 exact histories (former Onyx Medway site) and opening years.
- Check renewable-energy claims (Pulsant markets 100% renewable power for SC-3 per directory listings).
- Companies House number for Pulsant Limited not captured; add later.

## Location refinement, 30 July 2026

The earlier deliberate coarsening of this record was lifted by the project owner; everything below is drawn from material the operator or its customers publish openly. Pulsant's own SC-1 page and the facility's PeeringDB entry both place SC-1 at The Clocktower Estate, Flassches Yard, South Gyle Crescent, Edinburgh EH12 9LB. Coordinates were reset to the postcode-unit centroid for EH12 9LB from postcodes.io (55.929333, -3.293943); PeeringDB's own geocode (55.930562, -3.295901) is about 150 m away, which is within building scale for this estate, so the two do not materially conflict. `location_precision` is now `exact`, with the caveat recorded in `land_notes` that this record covers a three-building campus and the point is SC-1 only. Pulsant's page also gives a total building size of 4,648 m2 and total data hall space of 2,628 m2 for SC-1; the former is recorded as `gross_floor_area_m2` (developer-stated).

For context only, PeeringDB gives the two companion sites as 7 Bankhead Medway, Edinburgh EH11 4BY (labelled SC-2, Medway) and 7 Claylands Road, Newbridge, Edinburgh EH28 8LF (labelled SC-3, Newbridge). Data Center Map applies the SC-2/SC-3 labels differently across those two addresses; that naming conflict is unresolved and neither address has been used for the coordinate here. Still unknown: whether SC-2 and SC-3 should be split into their own project records, per-facility floor areas for those two sites, and any planning history. No planning application could be tied to the South Gyle site: the City of Edinburgh Idox portal was unreachable from this research environment on 30 July 2026, and no reference is quoted in any secondary source, so nothing has been recorded rather than guessing.
