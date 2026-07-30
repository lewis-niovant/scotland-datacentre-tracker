# DataVita DV1 "Fortis", Chapelhall — research notes (2026-07-30)

## What was checked
- North Lanarkshire Council Idox portal was returning errors on 2026-07-30, so planning records were taken from the PlanIt API mirror (`planit.org.uk/planapplic/NorthLanarkshire/...`), which carries dates, decisions, document counts and portal deep links.
- Operator material (datavita.co.uk DV1 page), industry press (DCD, New Project Media, Data Center Map), APRS's detailed Chapelhall AI Growth Zone site analysis, Companies House.

## Key facts
- DV1/Fortis: operating since 2016; Uptime Institute Tier III (design + construction); 24MW across c.8,000 sqm; marketed expandable to 40MW; widely described as Scotland's largest data centre.
- Two expansion strands, both treated here as phases of this record:
  - **DV1 extension** — 25/00150/FUL (full permission reported granted 2025-12-04, NPF4 Policy 8), varied by 25/01294/S42 (permitted 2026-02-24). Veteran "Muirhead Oaks" felled Feb 2026.
  - **DV3** — 25/01159/PPP on 1.8ha adjacent land, permitted 2026-01-09; MSCs 26/00350 (permitted 25 May 2026), 26/00214 (permitted 11 Jun 2026), 26/00803 (pending; includes *infrastructure to service a heat network* — consistent with the AIGZ claim of heat export to University Hospital Monklands).
- Corporate chain: HFD DataVita Ltd (SC467509) ← HFD Technology Group Ltd (SC806309, PSC since May 2024) ← HFD Group. Registered office 177 Bothwell Street, Glasgow.
- CoreWeave: Sept 2025 £1.5bn UK commitment naming "DataVita's Lanarkshire campus" for NVIDIA GB300 deployment — an announcement, not a disclosed contract.

## Conflicts / oddities
- **25/00150/PPP vs 25/00150/FUL**: PlanIt shows a PPP with this number "Pending Consideration" (stale since Jul 2025), while the S42 cites a granted **FUL** with the same number stem and description. Could not open the council portal to reconcile. Both recorded; flagged in unknowns.
- 24MW/40MW figures are operator marketing; IT-load vs grid-import basis unspecified. APRS reads 24MW as the power connection (recorded as a low-confidence separate claim).
- Sensitivity: `is_sensitive: true`, coordinates coarsened to 2dp per guide rule 7 (operating critical infrastructure). APRS publishes exact coordinates; deliberately not reproduced at full precision.

## Follow-ups
- Retrieve 25/00150/FUL decision notice and DV3 decision notice once the portal recovers; extract conditions and any capacity/EMP figures.
- Confirm construction start on extension/DV3 (site visits, drone/press coverage).
- Identify DV2 (presumed Bothwell Street), DV5 and DV7 site allocations.
