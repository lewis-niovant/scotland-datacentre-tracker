# Research notes — Spango Valley, Greenock (greenock-spango)

Researched 2026-07-30.

## What was checked

- **Developer consultation site** (spangovalleyconsultation.co.uk — home, proposals, updates pages): the primary public record at this stage. PAN stated as submitted 27 Feb 2026 (the research brief said 24 Feb — both dates retained; neither verified against the portal). Exhibitions 24 Mar & 23 Apr 2026 (Branchton Community Centre); online events 26 Mar & 28 Apr 2026. Application targeted June 2026; determination targeted Nov 2026. Data centre: Major application to Inverclyde Council, apparently via Planning Permission in Principle (floorspace "to be confirmed through PPP"). BESS: separate Section 36 (Electricity Act 1989) application to the ECU.
- **Inverclyde Council Idox portal** (planning.inverclyde.gov.uk/online-applications/): unreachable on 2026-07-30 — HTTP 503 via WebFetch and a TLS trust failure via the sandbox proxy for curl. **The PAN reference number could not be obtained.** No press or Edinburgh Gazette notice states it either (Gazette search for "Spango Valley" returns only 1960s–80s road orders and IBM directory entries).
- **Companies House** (fetched directly): Slate Island Developments Ltd, SC680122, inc. 6 Nov 2020, Greenock registered office, SIC 68100, sole director Alexander (Sandy) Easdale. PSC history: James and Alexander Easdale registered as PSCs (25–50% each) at incorporation, both **ceased 22 Apr 2021**, replaced by an active statement that the company has no registrable PSC. Beneficial ownership is therefore not public — worth flagging.
- **Press**: DCD article (24/25 Mar 2026) blocked with 403; read via BeBeez syndication. Inverclyde Now covered the pivot ("Plans for old IBM site switch from housing to hi-tech and energy uses"). No Greenock Telegraph coverage surfaced in search.
- **Prior housing consent**: PPP applied Feb 2020 (Barton Willmore for Sandy & James Easdale + Advance Construction; £100m, up to 450 homes, park-and-ride at the IBM rail halt). Planning board initially capped at 270 homes; 450 upper limit restored; finalised March 2023. Marketing failed to find a viable end user — stated rationale for the data centre pivot. Exact PPP reference unverified (council committee PDFs reference "22-0225-IC"; not confirmed).
- **APRS** tracker page exists (aprs.scot/greenock-ibm-data-centre/) but returned no readable content.
- **Marketing aggregators**: Colo Map lists "Spango Valley DCH1" as *operational* with colocation packages — plainly wrong given planning status; recorded as an unreliable tier-5 source. Data Center Map lists "Spango Valley Campus" (429 on fetch).

## Key figures and conflicts

- Data centre: **max 150 MW** (developer updates page only; no IT-load split). Two buildings, 34,500 + 40,000 sqm ≈ 74,500 sqm (DCD, from site plans).
- BESS: rendered variously as **99 MW** (homepage, DCD), **c.99.9 MW**, and **99.9 MWh** (updates page) — MW vs MWh never clarified. Recorded as conflicting claims. BESS kit: 132kV & 33kV substations, inverters, 120,000 L water tank, SuDS pond.
- Grid: developer claims a **Gate 1 offer from SPEN** to an unnamed local substation. No NESO/SPEN record found.
- Jobs: ~1,200 construction / ~50 operational — developer-stated, no methodology, no consultant, category not specified by claimant; classified with caveats in economic_claims.json.
- Consultation attendance (developer's own figures): 4 in person, 0 online at round one.

## Not found / could not verify

- PAN reference; any validated application; any ECU s36 case.
- **Fibre/subsea connectivity claims: none found anywhere**, despite the brief's pointer to Greenock's cable history — neither the consultation site nor press makes any connectivity claim. Do not attribute one.
- Cooling technology, water demand, PUE, energy use — nothing published (no energy/water estimate files created).
- Current registered landowner (2026); whether the 450-home PPP consent is retained/surrendered.
- Named operator ("strong interest" only).

## Follow-ups

1. Retry the Inverclyde Idox portal for the PAN reference and any June-2026 application; check ECU portal for the BESS s36.
2. Registers of Scotland title search for current ownership.
3. Watch for the pre-application consultation report (will accompany the application) — it will contain the definitive PAN reference, dates and feedback record.
4. Clarify BESS MW vs MWh from the s36 application when lodged.
5. Check Slate Island Developments' 2025 accounts (due Sep 2026) and any charges for funding signals.
