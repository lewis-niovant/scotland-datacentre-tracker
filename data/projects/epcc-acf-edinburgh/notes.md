# EPCC Advanced Computing Facility - research notes

Included as the individually notable research/HPC site: hosts the UK national supercomputer ARCHER2 and the planned UK exascale system, with a 38 MW grid capacity making it one of the largest power allocations of any Scottish data centre site.

## What was checked
- EPCC ACF page (secure, resilient data centre; hosts ARCHER2 and other systems).
- University of Edinburgh news (Oct 2023): exascale hosting decision, GBP31m new wing under City Region Deal, 8 MW to 38 MW capacity upgrade in 2023.
- DCD: 2024 UK Government cancellation of exascale funding and subsequent ~GBP750m reinstatement.

## Sensitivity
Deliberately coarse location and no operational security detail recorded (national research infrastructure).

## Conflicts / caveats
- 38 MW is grid capacity, not current draw.
- Exascale timeline shifted repeatedly (2023 announcement, 2024 cancellation, 2025 reinstatement); phase recorded as under_construction with narrative in description.

## Follow-ups
- Locate Midlothian planning records for the exascale wing to raise verification of that phase to planning-portal level.
- Capture cooling/heat-reuse plans (EPCC has discussed waste-heat schemes) with sources.

## Location refinement, 30 July 2026

Coarsening lifted by the project owner, and the Bush Estate / Easter Bush belief confirmed against a primary record. Midlothian Council planning application 22/00803/DPP, "Extension to advanced computer facility and associated works", is registered at "ACF Bush Estate Penicuik EH26 0PH" - the Advanced Computing Facility itself. That fixes both the address and the postcode. Coordinates were reset to the postcode-unit centroid for EH26 0PH from postcodes.io (55.859348, -3.207051).

`location_precision` is `site_centroid` rather than `exact`, deliberately: EH26 0PH covers a large rural research estate rather than a single plot, so the centroid locates the estate, not the building. EPCC's own contact material cites EH26 0QA for the Bush Estate; its centroid (55.855483, -3.199822) is roughly 600 m away. EH26 0PH is preferred here because it comes from the planning record for the facility, and the alternative is recorded in `land_notes` rather than discarded.

The application has been added to `planning_cases.json` as a full application, received 7 November 2022 and validated 3 August 2023, with the official Midlothian Idox URL. Two caveats: the council portal itself could not be reached from this research environment on 30 July 2026 (the gateway refused the connection), so the dates and description come from the Planning Alerts mirror of that record and should be re-verified against the council; and the decision and decision date are not established, so no `decision` field was set. The identification of this application as the circa GBP31m exascale wing is a strong inference from the description and timing but was not confirmed from the application documents, which were not read - that is flagged in the case description.

No floor area was recorded. EPCC publishes computer room and plant room areas (cr1 285 m2, cr2 285 m2, cr3 470 m2, cr4 500 m2, plus plant rooms totalling about 2,353 m2), but these are internal room areas and do not amount to a stated gross floor area or footprint for the buildings, so they were not entered as a site quantity claim. Still unknown: actual power draw against the 38 MW upgraded grid capacity, the ACF's original opening year, and the outcome of 22/00803/DPP.
