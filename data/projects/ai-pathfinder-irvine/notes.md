# AI Pathfinder Irvine (i3) — research notes

Researched 2026-07-30. This record documents the widest claims-vs-evidence gap in the dataset: a £15bn / 1-1.5 GW announcement with no planning trail, no grid evidence, no land evidence, and a developer that press reporting says effectively ceased operations within four months of the announcement.

## What was announced

On 19 September 2025 (around the US-UK tech/trade deal news cycle), AI Pathfinder announced an £18.4bn UK "sovereign AI" programme (2 GW by 2030), comprising a £3.4bn Chelveston, Northamptonshire site (with Dell/Nvidia hardware, first phase claimed "later in 2025") and "up to £15bn" in West Scotland at the i3 area of Irvine: a "1 GW site" scalable to 1.5 GW, £385m initial deployment, up to 6,400 GPUs, operations "from 2026". North Ayrshire Council (Cllr Tony Gurney) publicly welcomed it (Irvine Times, STV, council news page — the latter now 404).

Internal inconsistencies were visible from day one: 6,400 GPUs corresponds to roughly tens of MW of IT load, not 1 GW; a 2026 operations date is impossible for a development that had not even lodged a PAN (Scottish major/national developments require a PAN plus a minimum 12-week pre-application consultation before application).

## Who AI Pathfinder is

- **AI Pathfinder Inc Limited**, Companies House 16471441, incorporated **23 May 2025** — four months before the announcement. SIC 64209 (holding company), registered at 58 Grosvenor Street, London W1K 3JB. No accounts filed (first due Feb 2027). A sibling, **AI Pathfinder Holdings Limited** (16926656), was incorporated 22 Dec 2025 at the same address.
- Co-founded by **Martin Bellamy** (chairman/CEO of Salamanca Group, London property firm) and **Martin Hughes** (waste-management entrepreneur), via an Isle of Man holding company formed mid-2025 (Sifted). "Salamanca subsidiary" framing in press was never documented as actual ownership.
- Board chair: **Lord Dominic Johnson** (former UK investment minister), a personal investor; **Michael Dell** was courted/involved (City A.M.); the Wykes family were principal investors. Ashurst acted as legal adviser. No track record of building or operating data centres was identified for the company.

## Collapse (per City A.M., 24 Jul 2026; Sifted)

Seed round of ~£100m at a £500m valuation completed November 2025. Bellamy-Hughes dispute (Hughes had advanced £12.5m in loans) led to shareholder litigation and an **asset freeze**. In early **January 2026** management bought the company for **£17.7m**. Hughes challenged the sale as a dishonest undervalue; on **24 July 2026** the High Court (Mr Justice Trower) rejected the challenge, finding the allegations rested on "unevidenced suspicion". City A.M. states the company "effectively ceased operations" and the ~196-acre Ayrshire site "remains undeveloped". Caveat: the collapse narrative rests on tier-4 journalism (City A.M., Sifted — partly paywalled); no company or council confirmation. The corporate website is now an empty shell (news page 404), corroborating cessation.

## Negative findings (checked 2026-07-30)

- **Planning**: North Ayrshire e-planning portal searches for "data centre" and "i3 Irvine" return nothing for this project — no application, PAN, EIA screening or scoping. Only data-centre record in the authority is 26/00138/EIA (Hunterston Estate, unrelated — see `hunterston` project). ("Pathfinder" keyword search returned a portal 500 error; the other two searches are considered sufficient.)
- **Grid**: no SPEN/NESO/Ofgem record, substation or reinforcement evidence found for a 1,000 MW connection.
- **Land**: no evidence of any option, purchase or agreement over i3 land (much of which is council/public-sector controlled Enterprise Area plots). The reported ~196 acres exceeds obvious available i3 plots.
- **Funding**: no evidence of committed capital beyond the ~£100m seed round for the entire UK programme.

## Status judgement

Status "announced", M0, flag "paused", verification "reported", confidence low. Not marked "withdrawn"/"lapsed" because no formal process ever existed to withdraw from; not "superseded". If a council or company statement confirms abandonment, consider status "paused"→ a terminal treatment and updating `latest_development`.

## Conflicts preserved

- 1 GW claimed capacity vs 6,400-GPU initial deployment (orders-of-magnitude mismatch) — both recorded in capacity_claims.
- £15bn claim vs ~£100m evidenced funding — recorded in economic_claims notes.
- Sifted's paywalled figures (e.g. per-site investment splits) could not be verified and were not recorded.

## Follow-ups

1. Monitor North Ayrshire portal for any i3 application (none expected).
2. Check whether AI Pathfinder Holdings Limited (16926656) files accounts or takes any action re: Scotland; watch for insolvency filings on 16471441.
3. Seek any post-buyout North Ayrshire Council statement (FOI candidate: correspondence/land discussions with AI Pathfinder re i3).
4. Obtain the 24 Jul 2026 High Court judgment ([2026] EWHC, Trower J) for authoritative corporate detail.
5. Check whether the Chelveston, Northamptonshire site progressed — a useful credibility signal for the whole programme.
