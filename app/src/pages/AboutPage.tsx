import { fmtDate, TIER_LABELS, useDataset } from '../lib/data'

const GLOSSARY: Array<[string, string]> = [
  ['MW (megawatt)', 'A unit of power — the rate at which electricity is used at a moment in time. A large data centre campus might claim hundreds of MW; a kettle uses about 0.003 MW.'],
  ['MWh / GWh (megawatt-hour / gigawatt-hour)', 'Units of energy — power used over time. 1 GWh = 1,000 MWh = the energy of running a 1 MW load for about 42 days. Annual consumption figures are quoted in GWh per year.'],
  ['IT load', 'The power actually consumed by the computing equipment, excluding cooling and other overheads. Developers sometimes quote IT load and sometimes total site power, which makes figures hard to compare.'],
  ['Grid import capacity', 'The maximum power a site is allowed (or has applied) to draw from the electricity network. This is a ceiling, not what the site actually uses.'],
  ['PUE (Power Usage Effectiveness)', 'Total facility power divided by IT power. A PUE of 1.2 means 20% overhead on top of the computing load. Lower is more efficient.'],
  ['WUE (Water Usage Effectiveness)', 'Litres of water used per kWh of IT energy — a measure of how water-hungry the cooling design is.'],
  ['EIA (Environmental Impact Assessment)', 'A formal assessment of a project’s likely significant environmental effects, required for certain developments under Scottish EIA regulations. A council can "screen" a project as not requiring one.'],
  ['PAN (Proposal of Application Notice)', 'The notice a developer must give a Scottish planning authority at least 12 weeks before submitting a major application, triggering pre-application community consultation.'],
  ['PPP / Permission in principle', 'Planning permission in principle establishes that a development of a broad type is acceptable on a site, with details ("matters specified in conditions") settled later. It is not a detailed consent.'],
  ['Job-year', 'One person employed for one year. "9,660 job-years" over a multi-year construction programme is very different from 9,660 permanent jobs.'],
  ['BESS (Battery Energy Storage System)', 'Grid-scale batteries, often co-located with or adjacent to data centre proposals.'],
  ['Hyperscale', 'Very large data centres built for cloud or AI operators, typically tens to hundreds of MW.'],
  ['Colocation', 'A data centre that rents space and power to many customers, rather than serving one operator.'],
]

export default function AboutPage() {
  const ds = useDataset()
  const snapshot = ds.observatory.constants?.snapshot_date ?? ds.observatory.generated_from_snapshot
  const comparisons = ds.observatory.constants?.comparisons ?? {}
  const national = ds.observatory.constants?.national_context ?? {}
  const boundaryProjects = new Set(
    ds.geo.features
      .filter((feature) => feature.properties.kind === 'boundary')
      .map((feature) => feature.properties.slug)
      .filter(Boolean),
  ).size

  return (
    <div className="page about">
      <h1>About the Observatory</h1>
      <p className="lede">
        An independent, evidence-led public resource documenting Scotland's operating, proposed,
        approved, refused, withdrawn and speculative data centre developments. Not a campaign site
        and not an industry promotional site.
      </p>

      <section className="section">
        <h2>Editorial principles</h2>
        <ul className="plain">
          <li><strong>Primary-source first.</strong> Planning portals, EIA documents, decision notices, Companies House and government/regulator publications outrank press releases and campaign material.</li>
          <li><strong>Preserve uncertainty.</strong> Every material value carries an explicit state — confirmed, reported, developer-stated, modelled, estimated, disputed, unknown — and a source reference. Missing fields are never silently filled.</li>
          <li><strong>Preserve conflicting values.</strong> When sources disagree (a developer says 600 MW, an application says 400 MW), all claims are retained side by side with a stated preferred interpretation and rationale. We never average or pick silently.</li>
          <li><strong>No false precision.</strong> Derived figures (household equivalents, football pitches) disclose their assumptions and can be switched off.</li>
          <li><strong>Neutral language.</strong> Objections and benefits are described as claims by named parties.</li>
        </ul>
      </section>

      <section className="section">
        <h2>Source hierarchy</h2>
        <p className="small">Every source in the ledger carries a reliability tier:</p>
        <ul className="plain">
          {[1, 2, 3, 4, 5].map((t) => <li key={t}>{TIER_LABELS[t]}</li>)}
        </ul>
      </section>

      <section className="section">
        <h2>Known data gaps</h2>
        <ul className="plain">
          <li>
            <strong>No public register of demand grid connections exists.</strong> Generation
            connections are published; the queue of demand connections (which is where data centres
            sit) is not, so claimed "secured grid positions" usually cannot be independently checked.
            {national.gb_demand_connection_queue_gw && (
              <div className="small muted">
                Context: the GB demand connection queue was reported at{' '}
                {national.gb_demand_connection_queue_gw.value} GW ({national.gb_demand_connection_queue_gw.source}
                {national.gb_demand_connection_queue_gw.note ? ` — ${national.gb_demand_connection_queue_gw.note}` : ''}).
              </div>
            )}
          </li>
          <li>
            <strong>Figures are snapshots.</strong> All data was researched and verified manually as
            of <strong>{fmtDate(snapshot)}</strong>; it does not auto-update. Applications, objection
            counts and company records will have moved on.
          </li>
          <li>
            <strong>Early-stage projects are thin by design.</strong> Where a project exists only as
            a press release, that is what the record says — gaps are listed under "What we don't
            know" rather than guessed at.
          </li>
        </ul>
      </section>

      <section className="section">
        <h2>Site boundaries on the map</h2>
        <ul className="plain">
          <li>
            <strong>Solid red lines are official.</strong> They are the red-line application
            boundaries published in the Spatial Hub Scotland planning-applications dataset (local
            authority data, Ordnance Survey base, licensed under the Open Government Licence v3),
            retrieved on the snapshot date. {boundaryProjects} of the {ds.observatory.projects.length} projects currently have one; the remainder
            appear as approximate points, with dashed modelled extents only where a sourced site
            area supports one.
          </li>
          <li>
            <strong>The official area often disagrees with the reported one.</strong> Where both
            exist, profiles show the red-line area and the researched/reported figure side by side
            rather than reconciling them.
          </li>
          <li>
            <strong>Football-pitch grids and 3D masses are drawn by us.</strong> The pitch grid tiles
            105 × 68 m cells inside the official boundary; building masses use the published footprint
            and maximum height, but their layout is invented and captioned as indicative. Both are
            switchable, like every other comparison.
          </li>
        </ul>
      </section>

      <section className="section">
        <h2>Comparison constants</h2>
        <p className="small">
          Scale comparisons in project profiles use these disclosed constants and can be turned off:
        </p>
        <ul className="plain">
          {Object.entries(comparisons).map(([k, v]) => (
            <li key={k}>
              <strong>{k.replace(/_/g, ' ')}:</strong> {v.value.toLocaleString('en-GB')}
              {v.definition && <div className="small muted">{v.definition}</div>}
            </li>
          ))}
        </ul>
      </section>

      <section className="section">
        <h2>Glossary</h2>
        <dl className="glossary">
          {GLOSSARY.map(([term, def]) => (
            <div key={term}>
              <dt>{term}</dt>
              <dd>{def}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
