# Research notes — Cato data centre, Auchtertool (Camilla Farm), Fife

Researched 2026-07-30.

## What was checked

- **Fife planning portal (Idox)**: located 26/01243/PPP directly (keyVal `TE9GGMHFFWY00`). Confirmed description ("Planning permission in principle for a data centre campus (Class 6) comprising data hall buildings, gatehouses and associated infrastructure"), address (Land To The North Of Camilla Road, Gleniston, Auchtertool), received 29 Apr 2026, **validated 21 May 2026** (task brief said ~25 May — that is the APRS-reported *publication* date, 25 May 2026), status Registered, 1,651 documents, applicant "Mr Greig Templeton", agent Simon Munro (LoganPM), case officer Scott Simpson, portal "Environmental Assessment Requested: No", neighbour consultation expiry 24 Jul 2026. Individual documents (planning statement, energy statement, water assessment) were **not** retrievable through the fetcher (Idox document tab is JS/session-bound); key figures therefore come from SPICe, APRS (who read the documents) and press.
- **EIA history** (via APRS + Central Fife Times): PAN 25/00552/PAN agreed 22 Mar 2025; EIA screening 25/03079/SCR submitted 10 Nov 2025 (after two timetable extensions, incl. NatureScot consultation), screening opinion 1 Apr 2026 = **EIA not required**. Community council consulted Environmental Rights Centre Scotland ("credible legal basis for a challenge"); a **screening direction request is now with the Scottish Government** — outcome unknown as of 30 Jul 2026.
- **Companies House**: ILI Cato Limited **SC825081**, inc. 7 Oct 2024, 33 Bothwell Road, Hamilton; sole director **Mark Thomas Wilson** (ILI CEO); PSC **Intelligent Land Investments Group Plc SC564296** (75%+ shares/votes, appoints directors). Straightforward one-SPV structure under the ILI Group parent.
- **SPICe** (26 Jun 2026 blog): ~280,000 m² of buildings, up to 35 m, ~400 GWh/yr early phase possibly rising to 4,000 GWh/yr (7.7% of Scottish 2024 generation).
- **Press**: Data Centre Review (submission + objections articles), Architects' Journal (Graeme Nicholls Architects, six identical-footprint buildings, stoa-inspired design), STV, Central Fife Times, DCD (403 to fetcher; 25 ha figure from search excerpts only).
- **Community**: APRS campaign page + objection; Auchtertool village site (Nov 2025 CC update); "Say No to Cato" Facebook group.

## Conflicts preserved

- **Building count**: 6 (AJ, from the architect) vs "up to seven buildings plus on-site substation" (STV, from site plans) → recorded as min 6 / max 7.
- **Permanent jobs**: 30–50 (developer to CC, Nov 2025, marked superseded) vs ~120 on-site skilled roles (application stage); BiGGAR figures of 540 Scotland / 262 Fife operational jobs recorded as `total_jobs_unspecified` because the direct/indirect split isn't published.
- **Build programme**: five-year phased rollout (DCR) vs three-year build programme (STV).
- **Site vs building area**: 25 ha site (DCD) vs 280,000 m² (28 ha) of buildings — cannot both describe the same red line; red-line area unverified.
- **Capacity**: no conflicting MW figure found — 600 MW is consistent everywhere (no 550 MW variant located for Cato; that may relate to a sibling project).
- **Energy**: application ~4,000 GWh/yr ultimate vs APRS calculation 4,200 GWh/yr (80% load factor) — consistent, both recorded.

## Could not verify / follow-ups

1. Agricultural land class (LCA), red-line hectarage, backup-generation type/capacity, cooling technology, water source detail — all should be in the 1,651 portal documents (planning statement, energy statement, drainage/water assessments); needs a session that can pull Idox document PDFs.
2. Gate 2 / 600 MW grid position: developer claim only; check NESO TEC register (which operator — site is north of the Forth so likely SSEN Transmission area) and any connection-site naming.
3. Scottish Government EIA screening direction outcome.
4. Final representation numbers and objection/support split once Fife Council publishes all 14,000–16,000 responses.
5. Hallyards Castle: APRS says plans show buildings over the ruins — check HES designation status.
6. Portal applicant "Mr Greig Templeton" vs applicant company ILI Cato Limited — clarify (Templeton may be an ILI employee or landowner).
7. Coordinates used are APRS's (56.109111, -3.265364), precision "approximate". No boundary polygon drawn — the location plan wasn't retrievable, so `geo/boundary.geojson` deliberately omitted.

Sources for this project are in `sources.json` in this folder (global ledger merge handled elsewhere, per instructions).
