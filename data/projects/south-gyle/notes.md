# South Gyle (1 Redheughs Avenue, Edinburgh) — research notes

Researched 2026-07-30. This is Scotland's key data centre refusal case: a c. 212.4 MW "green" data centre refused unanimously by City of Edinburgh Council against officer recommendation, now under appeal to the DPEA.

## What was checked

- **CEC Idox portal** (`citydev-portal.edinburgh.gov.uk`): unreachable from the research environment (connection refused/blocked at both WebFetch and curl level). References and keyVals were instead confirmed via the DPEA case record and APRS, which reproduce the portal URLs: PPP `25/04239/PPP` (keyVal `T16TBMEWJO800`), EIA screening `25/03575/SCR` (keyVal `SZ4X9BEW0XE00`). Application documents (planning statement, Energy & Sustainability Statement incl. waste heat strategy, committee report) therefore could not be read directly.
- **DPEA** (`CaseDetails.aspx?ID=128582`): retrieved successfully. Appeal **PPA-230-2794**, received 31 Mar 2026, authority decision date 9 Feb 2026, application date 18 Aug 2025, written submissions + further written submissions, reporter Ms Sue Bell, status "Allocated to reporter", target date 18 Aug 2026, case update 15 Jun 2026 (one further written information request outstanding), 196 documents incl. 38 representation documents. The DPEA case search form itself rejects scripted POSTs; the case was found via the APRS page's direct link.
- **Companies House**: Shelborn Drummond Ltd (14136984, SPV, inc. 27 May 2022) → PSC Shelborn Edinburgh Ltd (13368052, 75%+); group hub Shelborn Asset Management Ltd (08439076); directors B. Rabinowitz, M. C. Rabinowitz, M. Stimler. All at Sutherland House, 70-78 West Hendon Broadway, London NW9 7BT.
- **Developer material**: Scott Hobbs Planning project page and the 22 May 2025 consultation boards (PDF read in full): two buildings, 25–32 m illustrative height parameter, dedicated substation, standby generator compounds, security fencing, relocated park at Lochside Court, extant office consent 22/05659/FUL context.
- **Journalism/campaign**: Deadline News (27 Jan, 4 Feb 2026), Data Centre Review (2 & 5 Feb 2026), The Register (10 Feb), Scottish Construction Now, Edinburgh Inquirer, Cockburn Association, APRS case page and 4 Feb press release (with first-hand committee observations).

## Key facts and conflicts

- **Capacity**: 212.42 MW (APRS quoting application) vs "up to 213MW IT load" (press) vs "210MW draw from the grid" (APRS press release). Preserved as separate claims; 212.42 preferred. Whether it is IT load or grid import is unresolved.
- **Decision dates**: committee vote 4 Feb 2026 (unanimous, after ~2h debate in a 4h meeting); DPEA records the authority's decision as **9 Feb 2026** (used as decision_date). Scottish Construction Now's summary mentioned 13 Feb — treated as unreliable; the decision appears in the council weekly list of 16 Feb 2026 (Part D), which could not be downloaded (Cloudflare 403).
- **Refusal reasons** (per APRS, present at the meeting): contrary to **NPF4 Policy 1** (climate), **NPF4 Policy 2** (lifecycle GHG emissions), and **City Plan 2030 Place 19** (mixed-use vision for Edinburgh Park). The verbatim decision notice wording was not obtainable.
- **Committee report position**: officers recommended approval in principle, resting significantly on green data centres' NPF4 "national development" status; officers acknowledged no definition/glossary entry for "green data centre" exists and told members the judgement was "in their gift". The Scottish Government's only definition guidance is one sentence in answer to written question S6W-41362.
- **Jobs**: council consultation response estimated **39 jobs**; developer did not dispute low staffing; >200 parking spaces queried at committee. No developer jobs/investment/GVA figures found anywhere public.
- **Housing proximity**: consented mixed-use scheme incl. housing c. 50 m away (expected to start 2026); nursery 220 m; site upwind of city centre (all APRS claims).
- **EIA**: screening 25/03575/SCR concluded EIA not required (brownfield urban site, "negligible impact" on national GHG targets). Heavily contested; screening documents now lodged on the appeal file; appeal representations invoke the Finch UKSC ruling and Raeshaw Farms v Scottish Ministers [2026] CSIH 10.
- **Appeal**: Shelborn Appeal Statement dated 30 Mar 2026 (hosted by APRS; download blocked by captcha — grounds not read). Representations deadline was 28 Apr 2026; 37 redacted representations + APRS + ERCS Legal submissions.

## Could not verify / follow-ups

1. Objection/support counts on 25/04239/PPP — needs portal or committee report access (democracy.edinburgh.gov.uk also 403 from this environment; the 4 Feb 2026 DMSC public reports pack would give the full report incl. representation numbers and conditions).
2. Verbatim refusal reasons from the decision notice (available on the portal and in DPEA "Authority Response" documents).
3. Shelborn's grounds of appeal — read the Appeal Statement PDF when accessible.
4. Backup generation MW/generator count, PUE, annual GWh, water strategy — in the Energy & Sustainability Statement (portal document `25_04239_PPP-ENERGY_AND_SUSTAINABILITY_STATEMENT...`).
5. Grid connection: check NESO connections queue / SP Energy Networks heat maps for a South Gyle 200+ MW demand connection.
6. PAN reference for the May–June 2025 consultation.
7. Watch for the DPEA decision — target 18 Aug 2026; the outcome will be a bellwether for Scottish data centre appeals (cf. BBC report "Rejected data centre gets approval after appeal" — check whether that refers to this or another case when updating).
8. Boundary geojson: digitise from the PAN red line / application drawings once the portal is accessible (site is the triangle-ish parcel south of Redheughs Avenue, west of South Gyle Crescent, ~5.74 ha).

## Neutrality note

Objection framings ("100,000 idling cars", "200,000 tonnes CO2", household equivalences) are recorded as claims by APRS/Cockburn; developer "green"/heat re-use claims are recorded as developer-stated and were found unevidenced by the committee rather than false.
