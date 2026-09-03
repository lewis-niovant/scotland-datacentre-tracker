import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import type { ProjectRecord } from '../types'
import {
  fmtDate,
  fmtInt,
  fmtMW,
  projectCoords,
  stateLabel,
  statusGroup,
  statusLabel,
  useDataset,
} from '../lib/data'
import {
  deriveOverviewInsights,
  isActivePipelineProject,
  type CapacitySummary,
} from '../lib/insights'
import '../overview.css'

const PLOT = { west: -8.2, east: -0.4, south: 54.5, north: 61.1, width: 400, height: 560 }

/* A deliberately simplified mainland outline. It provides geographic context
   without adding another map or network request; the project points themselves
   use their recorded coordinates. */
const MAINLAND: Array<[number, number]> = [
  [-5.05, 54.68], [-4.45, 54.82], [-3.02, 54.96], [-2.00, 55.82],
  [-1.76, 55.96], [-2.10, 56.30], [-2.48, 56.67], [-2.08, 57.14],
  [-2.12, 57.68], [-3.05, 58.63], [-4.02, 58.67], [-4.73, 58.51],
  [-5.10, 58.26], [-4.72, 57.84], [-5.20, 57.59], [-5.83, 57.83],
  [-5.98, 57.55], [-5.31, 57.27], [-5.74, 56.98], [-5.42, 56.70],
  [-5.78, 56.47], [-5.26, 56.08], [-5.02, 55.85], [-5.14, 55.44],
  [-4.88, 55.16], [-4.45, 54.82],
]

const ISLANDS: Array<Array<[number, number]>> = [
  [[-6.88, 56.78], [-6.28, 56.93], [-6.20, 57.45], [-6.54, 57.72], [-6.95, 57.35]],
  [[-7.50, 57.55], [-6.95, 57.77], [-6.77, 58.28], [-7.18, 58.58], [-7.55, 58.12]],
  [[-3.42, 58.78], [-2.68, 58.78], [-2.63, 59.15], [-3.18, 59.24]],
  [[-1.72, 59.86], [-1.05, 60.10], [-0.86, 60.66], [-1.40, 60.90], [-1.74, 60.42]],
]

function plotPoint([longitude, latitude]: [number, number]): [number, number] {
  const x = 22 + ((longitude - PLOT.west) / (PLOT.east - PLOT.west)) * (PLOT.width - 44)
  const y = 20 + ((PLOT.north - latitude) / (PLOT.north - PLOT.south)) * (PLOT.height - 40)
  return [x, y]
}

function polygonPath(points: Array<[number, number]>): string {
  return points.map((point, index) => {
    const [x, y] = plotPoint(point)
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ') + ' Z'
}

function displayCapacity(summary: CapacitySummary): string {
  if (!summary.withCapacity) return 'No figure'
  if (summary.capacityMinMw === summary.capacityMaxMw) return fmtMW(summary.capacityMinMw)
  return `${fmtMW(summary.capacityMinMw)}–${fmtMW(summary.capacityMaxMw)}`
}

function claimStateSummary(summary: CapacitySummary): string {
  if (!summary.claimStates.length) return 'No capacity figure located'
  return summary.claimStates.map((state) => stateLabel(state)).join(', ')
}

function projectName(project: ProjectRecord): string {
  return project.project.display_name ?? project.project.canonical_name
}

function markerClass(project: ProjectRecord): string {
  const group = statusGroup(project.project.status)
  if (group === 'operating') return 'is-operating'
  if (isActivePipelineProject(project)) return 'is-pipeline'
  if (group === 'refused') return 'is-refused'
  return 'is-other'
}

function ScotlandProjectPlot({ projects }: { projects: ProjectRecord[] }) {
  const plotted = projects.flatMap((project) => {
    const coordinates = projectCoords(project)
    return coordinates ? [{ project, coordinates }] : []
  })

  return (
    <figure className="overview-plot-card">
      <figcaption>
        <span className="overview-plot-kicker">Where the projects are</span>
        <strong>{plotted.length} mapped locations</strong>
        <span>Schematic plot · select a point to open it on the map</span>
      </figcaption>
      <svg
        className="overview-scotland-plot"
        viewBox={`0 0 ${PLOT.width} ${PLOT.height}`}
        aria-hidden="true"
        focusable="false"
      >
        <path className="overview-land" d={polygonPath(MAINLAND)} />
        {ISLANDS.map((island, index) => (
          <path className="overview-land overview-island" d={polygonPath(island)} key={index} />
        ))}
        {plotted.map(({ project, coordinates }) => {
          const [cx, cy] = plotPoint(coordinates)
          const name = projectName(project)
          return (
            <Link
              className={`overview-map-point ${markerClass(project)}`}
              to={`/map?site=${project.project.slug}`}
              aria-label={`${name}, ${statusLabel(project.project.status)}. Open on the map.`}
              tabIndex={-1}
              key={project.project.slug}
            >
              <circle className="overview-map-hit" cx={cx} cy={cy} r="13" />
              <circle className="overview-map-dot" cx={cx} cy={cy} r="6" />
              <title>{name} · {statusLabel(project.project.status)}</title>
            </Link>
          )
        })}
      </svg>
      <div className="overview-plot-legend" aria-hidden="true">
        <span><i className="is-operating" />Operating</span>
        <span><i className="is-pipeline" />Active pipeline</span>
        <span><i className="is-refused" />Refused / withdrawn</span>
        <span><i className="is-other" />Other / speculative</span>
      </div>
      <details className="overview-plot-index">
        <summary>Browse the {plotted.length} mapped projects</summary>
        <ul>
          {[...plotted]
            .sort((a, b) => projectName(a.project).localeCompare(projectName(b.project)))
            .map(({ project }) => (
              <li key={project.project.slug}>
                <Link to={`/map?site=${project.project.slug}`}>
                  {projectName(project)} <span>· {statusLabel(project.project.status)}</span>
                </Link>
              </li>
            ))}
        </ul>
      </details>
    </figure>
  )
}

function CapacityCard({ title, summary, body, tone }: {
  title: string
  summary: CapacitySummary
  body: string
  tone: 'operating' | 'pipeline' | 'other'
}) {
  return (
    <article className={`overview-outcome-card ${tone}`}>
      <p className="overview-card-kicker">{title}</p>
      <div className="overview-card-value">{fmtInt(summary.projects)}</div>
      <p className="overview-card-label">projects · {displayCapacity(summary)} in headline capacity figures</p>
      <p>{body}</p>
      <p className="overview-card-note">
        Figures located for {fmtInt(summary.withCapacity)} of {fmtInt(summary.projects)} projects
        {summary.withCapacity ? ` · ${claimStateSummary(summary)}` : ''}.
      </p>
    </article>
  )
}

function Coverage({ label, found, total, note }: { label: string; found: number; total: number; note: string }) {
  const percentage = total ? Math.round((found / total) * 100) : 0
  return (
    <article className="overview-coverage-card">
      <div className="overview-coverage-head">
        <strong>{label}</strong>
        <span>{found} of {total}</span>
      </div>
      <div
        className="overview-coverage-track"
        role="progressbar"
        aria-label={`${label}: published figure or record located for ${found} of ${total} projects`}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={found}
      >
        <span style={{ width: `${percentage}%` }} />
      </div>
      <p>{note}</p>
    </article>
  )
}

export default function OverviewPage() {
  const ds = useDataset()
  const insights = deriveOverviewInsights(ds)
  const projects = ds.observatory.projects
  const briefing = ds.observatory.briefing
  const comparisonMax = Math.max(insights.operating.capacityMaxMw, insights.activePipeline.capacityMaxMw, 1)
  const stageMax = Math.max(...insights.stages.map((stage) => stage.projects), 1)
  const pipelineIsMuchLarger = insights.activePipeline.capacityMinMw > Math.max(1, insights.operating.capacityMaxMw * 1.5)
  const pipelineIsLarger = insights.activePipeline.capacityMinMw > insights.operating.capacityMaxMw
  const heroTitle = pipelineIsMuchLarger
    ? 'Scotland’s data centre pipeline is much larger than what operates today.'
    : pipelineIsLarger
      ? 'Scotland’s data centre pipeline is larger than what operates today.'
      : 'Scotland’s data centre picture is changing.'
  const campaignGroups = insights.community.campaignGroups.slice(0, 8)

  return (
    <div className="overview-page">
      <section className="overview-hero" aria-labelledby="overview-title">
        <div className="overview-hero-copy">
          <p className="overview-eyebrow">Scotland Data Centre Observatory</p>
          <h1 id="overview-title">{heroTitle}</h1>
          <p className="overview-lead">
            We track {fmtInt(insights.totalProjects)} operating, proposed and speculative projects,
            separating what official records show from what developers and other parties claim.
          </p>
          <div className="overview-actions">
            <Link className="overview-button primary" to="/map">Explore the map</Link>
            <Link className="overview-button secondary" to="/projects">Browse every project</Link>
          </div>
          <p className="overview-trust-line">
            Snapshot {fmtDate(insights.snapshotDate)}
            <span aria-hidden="true"> · </span>
            {fmtInt(insights.evidence.totalSources)} sources
            <span aria-hidden="true"> · </span>
            figures remain claims unless labelled otherwise
          </p>
        </div>
        <ScotlandProjectPlot projects={projects} />
      </section>

      <div className="overview-main">
        {briefing && (
          <section className="overview-section overview-briefing" aria-labelledby="overview-briefing-title">
            <div className="overview-section-intro">
              <p className="overview-section-kicker">The national picture changed</p>
              <h2 id="overview-briefing-title">{briefing.headline}</h2>
              <p>{briefing.summary}</p>
              <p className="overview-briefing-date">Briefing checked {fmtDate(briefing.as_of_date)}</p>
            </div>
            <ol className="overview-briefing-list">
              {briefing.updates.map((update, index) => (
                <li key={`${update.date}-${update.title}`} className={index === 0 ? 'is-lead' : ''}>
                  <div className="overview-briefing-meta">
                    <time dateTime={update.date}>{fmtDate(update.date)}</time>
                    <span>{update.category.replace(/_/g, ' ')}</span>
                  </div>
                  <div>
                    <h3>{update.title}</h3>
                    <p>{update.summary}</p>
                    {update.project_slugs && update.project_slugs.length > 0 && (
                      <p className="overview-briefing-projects">
                        Projects:{' '}
                        {update.project_slugs.map((slug, projectIndex) => {
                          const record = projects.find((project) => project.project.slug === slug)
                          if (!record) return null
                          return (
                            <span key={slug}>
                              {projectIndex > 0 && ' · '}
                              <Link to={`/project/${slug}`}>{projectName(record)}</Link>
                            </span>
                          )
                        })}
                      </p>
                    )}
                    <p className="overview-briefing-sources">
                      {update.source_ids.map((sourceId, sourceIndex) => {
                        const source = ds.observatory.sources?.[sourceId]
                        if (!source) return null
                        return (
                          <span key={sourceId}>
                            {sourceIndex > 0 && ' · '}
                            {source.url ? (
                              <a href={source.url} target="_blank" rel="noreferrer">{source.publisher ?? source.title} ↗</a>
                            ) : (source.publisher ?? source.title)}
                          </span>
                        )
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="overview-section" aria-labelledby="overview-pipeline-title">
          <div className="overview-section-intro">
            <p className="overview-section-kicker">The first distinction</p>
            <h2 id="overview-pipeline-title">What exists, and what is still a proposal?</h2>
            <p>
              “Active pipeline” below means consented, under-construction, pending-application,
              live-appeal, pre-application and announced projects that are not recorded as paused. It
              excludes finally refused or withdrawn cases without a live appeal, as well as lapsed,
              speculative and grid-only records. Inclusion is not a prediction that a project will be built.
            </p>
          </div>
          <div className="overview-outcome-grid">
            <CapacityCard
              title="Operating now"
              summary={insights.operating}
              tone="operating"
              body="Facilities recorded as built and operating in this snapshot."
            />
            <CapacityCard
              title="Active development pipeline"
              summary={insights.activePipeline}
              tone="pipeline"
              body="Projects at very different stages, from announcements to construction."
            />
            <CapacityCard
              title="Outside the active pipeline"
              summary={insights.outsideActivePipeline}
              tone="other"
              body="Finally refused, withdrawn, lapsed, speculative or grid-only records retained for context."
            />
          </div>
        </section>

        <section className="overview-section overview-split" aria-labelledby="overview-scale-title">
          <div className="overview-section-intro">
            <p className="overview-section-kicker">Scale, with the caveat attached</p>
            <h2 id="overview-scale-title">Capacity claims are not the same as electricity use.</h2>
            <p>
              The figures mix developer statements, reported values and official records, and may
              describe IT load, grid import or eventual build-out. They are useful for seeing the
              scale of ambition, but they should not be read as demand already connected to the grid.
            </p>
            <Link className="overview-text-link" to="/map">Compare projects on the map <span aria-hidden="true">→</span></Link>
          </div>
          <div className="overview-capacity-comparison" role="group" aria-label="Headline capacity comparison">
            {[
              ['Operating', insights.operating, 'operating'],
              ['Active pipeline', insights.activePipeline, 'pipeline'],
            ].map(([label, rawSummary, tone]) => {
              const summary = rawSummary as CapacitySummary
              const width = summary.withCapacity ? Math.max(3, (summary.capacityMaxMw / comparisonMax) * 100) : 0
              return (
                <div className="overview-capacity-row" key={label as string}>
                  <div className="overview-capacity-label">
                    <span>{label as string}</span>
                    <strong>{displayCapacity(summary)}</strong>
                  </div>
                  <div className="overview-capacity-track">
                    <span className={tone as string} style={{ width: `${width}%` }} />
                  </div>
                  <small>{summary.withCapacity} of {summary.projects} projects publish a headline figure</small>
                </div>
              )
            })}
            <p className="overview-figure-note">Sums of headline project figures; mixed definitions and evidence states. Not a forecast.</p>
          </div>
        </section>

        <section className="overview-section" aria-labelledby="overview-planning-title">
          <div className="overview-section-intro narrow">
            <p className="overview-section-kicker">Planning is the dividing line</p>
            <h2 id="overview-planning-title">Announcements and applications carry different weight.</h2>
            <p>
              {fmtInt(insights.planning.formalOrBeyond)} projects have reached a formal application
              or later maturity stage; {fmtInt(insights.planning.earlyOrConcept)} remain at concept
              or early-development stage. The bars show every tracked project, including those no
              longer active.
            </p>
          </div>
          <ol className="overview-stage-list">
            {insights.stages.map((stage) => {
              const barStyle = {
                '--overview-stage-width': `${Math.max(3, (stage.projects / stageMax) * 100)}%`,
                '--overview-stage-colour': stage.colour,
              } as CSSProperties
              return (
                <li className="overview-stage-row" style={barStyle} key={stage.id}>
                  <div className="overview-stage-name">
                    <span className="overview-stage-dot" aria-hidden="true" />
                    <strong>{stage.label}</strong>
                  </div>
                  <div className="overview-stage-bar" aria-hidden="true"><span /></div>
                  <span className="overview-stage-count">{stage.projects} project{stage.projects === 1 ? '' : 's'}</span>
                  <span className="overview-stage-capacity">
                    {stage.withCapacity ? `${displayCapacity(stage)} claimed` : 'no capacity figure'}
                  </span>
                </li>
              )
            })}
          </ol>
          <div className="overview-planning-facts">
            <p><strong>{insights.planning.liveApplications}</strong><span>projects with a referenced formal application awaiting a decision</span></p>
            <p><strong>{insights.planning.projectsWithOfficialCase}</strong><span>projects with a referenced planning case</span></p>
            <p><strong>{insights.evidence.recordCheckedProjects}</strong><span>project records checked against official material</span></p>
          </div>
        </section>

        <section className="overview-section overview-evidence" aria-labelledby="overview-evidence-title">
          <div className="overview-section-intro narrow">
            <p className="overview-section-kicker">The gaps are part of the story</p>
            <h2 id="overview-evidence-title">A missing figure means “not published”, not zero.</h2>
            <p>
              Coverage varies sharply by topic. The Observatory records absence rather than filling
              it with an estimate. There are {fmtInt(insights.evidence.recordedUnknowns)} specific
              unanswered questions documented across project records.
            </p>
          </div>
          <div className="overview-coverage-grid">
            <Coverage label="Capacity" found={insights.evidence.capacityProjects} total={insights.totalProjects} note="A headline figure of any evidence state was located." />
            <Coverage label="Annual electricity" found={insights.evidence.energyProjects} total={insights.totalProjects} note="A published or modelled annual energy figure was located." />
            <Coverage label="Annual water" found={insights.evidence.waterProjects} total={insights.totalProjects} note="A project-level annual water figure was located." />
            <Coverage label="Community record" found={insights.evidence.communityProjects} total={insights.totalProjects} note="Concerns, claimed benefits or stakeholder context was documented." />
          </div>
          <p className="overview-evidence-note">
            The source ledger contains {fmtInt(insights.evidence.officialSources)} official or
            government sources among {fmtInt(insights.evidence.totalSources)} sources overall.
            Source type and claim state are shown separately because an official planning record can
            confirm an application exists without confirming every figure a developer includes in it.
          </p>
        </section>

        <section className="overview-section overview-community" aria-labelledby="overview-community-title">
          <div className="overview-section-intro">
            <p className="overview-section-kicker">Community response</p>
            <h2 id="overview-community-title">Concerns and promised benefits are attributed, not treated as facts.</h2>
            <p>
              Concerns are documented for {fmtInt(insights.community.projectsWithConcerns)} projects.
              Published objection counts were located for {fmtInt(insights.community.projectsWithPublishedObjections)};
              together those records show at least {fmtInt(insights.community.publishedObjectionsMinimum)} objections.
              Counts are portal minimums and are not directly comparable with petitions, campaign membership or public meetings.
            </p>
          </div>
          <div className="overview-community-panel">
            <div>
              <strong>{fmtInt(insights.community.stakeholderPositions)}</strong>
              <span>dated or attributed stakeholder positions recorded</span>
            </div>
            {campaignGroups.length > 0 && (
              <div className="overview-groups">
                <p>Resident, civic and campaign groups named in the dataset include:</p>
                <ul>
                  {campaignGroups.map((group) => <li key={group}>{group}</li>)}
                  {insights.community.campaignGroups.length > campaignGroups.length && (
                    <li>and {insights.community.campaignGroups.length - campaignGroups.length} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </section>

        {insights.recentUpdates.length > 0 && (
          <section className="overview-section overview-updates" aria-labelledby="overview-updates-title">
            <div className="overview-section-intro narrow">
              <p className="overview-section-kicker">Recently in the record</p>
              <h2 id="overview-updates-title">What changed before this snapshot</h2>
              <p>Latest dated developments recorded for individual projects. Open a project for the underlying claims and sources.</p>
            </div>
            <ol className="overview-update-list">
              {insights.recentUpdates.map((update) => (
                <li key={update.slug}>
                  <time dateTime={update.date}>{fmtDate(update.date)}</time>
                  <div>
                    <p className="overview-update-meta">{update.authority} · {statusLabel(update.status)}</p>
                    <h3><Link to={`/project/${update.slug}`}>{update.name}</Link></h3>
                    <p>{update.headline}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="overview-final-cta" aria-labelledby="overview-final-title">
          <div>
            <p className="overview-section-kicker">Explore the evidence</p>
            <h2 id="overview-final-title">See what is proposed near you, and how far it has actually progressed.</h2>
          </div>
          <div className="overview-actions">
            <Link className="overview-button primary" to="/map">Open the project map</Link>
            <Link className="overview-button secondary" to="/projects">View all records</Link>
          </div>
        </section>
      </div>
    </div>
  )
}
