# West Calder / Freeport AI Energy Campus — research notes (2026-07-30)

## What was checked
- **West Lothian Council portal** (`planning.westlothian.gov.uk/publicaccess`, Idox): direct access blocked from the research environment (TLS interception rejected). Content obtained via the **PlanIt API mirror**, which scrapes the same portal and returned two records verbatim:
  - **0346/EIA/25** — EIA screening opinion for a data centre campus, Land At Former Freeport Shopping & Leisure Village, Westwood, West Calder EH55 8PN. Validated 2025-05-02; decided **"Environmental Assessment Not Required" 2025-06-04** (delegated). 3 documents, 1 comment — not readable remotely.
  - **0625/PAC/25** — PAN, "erection of an AI Data Centre Campus with a **250 MW demand utility capacity** with ancillary battery energy storage system (BESS) (to be consented via separate Section 36 application to Scottish Government)...". Received 2025-08-05; **PAC response issued 2025-08-14**. Agent AAH Consultants (York) — same agent as other Apatura schemes.
- **Apatura consultation site** (consult.apatura.energy/freeport + /the-project + /benefits): 250 MW DC + 250 MW BESS; NESO grid offer at **Harburn substation** "formally accepted Q2 2025"; consultation Q3 2025; application target Q1/Q2 2026; construction 2027–28, operational 2029; £1.7bn investment and GVA claims (no job numbers anywhere).
- **Foxglove briefing (2 Dec 2025)**: table lists "Freeport, Freeport Shopping Village EH55 8PN, 250 MW, Apatura, West Lothian" — consistent, adds nothing new.
- **Companies House**: Apatura group uses Apatura DC Ltd (16041291) + numbered SPVs "Apatura DC Project 1–12 Ltd". Could not match a specific SPV to Freeport (portal applicant name field not exposed by PlanIt; CH API key unavailable, HTML search used).
- **News/community search**: no press coverage of local reaction, no campaign group activity, no councillor comment found specific to West Calder. Coverage of Apatura focuses on Wester Hermiston, Glenbervie/Larbert, Ravenscraig.

## Key judgements
- "Freeport" is the **former Freeport outlet shopping village** (brownfield, closed retail site) — *not* a Green Freeport tax designation. Recorded as an alias caution.
- Capacity provenance is solid to PAN level: "250 MW demand utility capacity" is the council-recorded wording; IT-load vs grid-import distinction not stated, so `capacity_type: unspecified`.
- Maturity **M1 / pre_application / verified**: screening + PAN exist on the official portal; no validated application found by 2026-07-30 despite the developer's Q1/Q2 2026 target. PlanIt's last scrape of West Lothian was mid-2025, so a 2026 submission could have been missed — flagged as the top follow-up.

## Conflicts / gaps
- No conflicting capacity claims found (250 MW everywhere).
- Grid offer claim is developer-only; not checked against NESO TEC register (not accessible in session).
- Screening opinion reasoning unread (documents behind blocked portal).

## Follow-ups
1. Re-check the West Lothian portal (manually/by keyword "Freeport") for a 2026 full application and for the s36 BESS application on the ECU portal.
2. Obtain the 0346/EIA/25 screening opinion PDF and PAC report; extract site area, buildings, applicant SPV name.
3. Verify Harburn grid connection in NESO connections data.
