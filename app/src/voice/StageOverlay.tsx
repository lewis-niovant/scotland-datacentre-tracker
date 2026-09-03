import { useEffect, useState } from 'react'
import type { Dataset } from '../lib/data'
import {
  developersOf, fmtGBP, fmtInt, fmtRangeMW, headlineCapacityMW, headlineCapexGBP,
  headlineEnergyGWh, headlineWaterM3, operationalJobsClaim, publishedObjections,
  statusGroup, statusLabel, STATUS_GROUP_META,
} from '../lib/data'
import { useStage, type StagedCard, type StageCard, type ArtifactKind } from './stage'

/* Renders whatever the agent has staged. Streaming artifacts are parsed on
   every frame from the partial text, so a table grows a row at a time and a
   list grows a bullet at a time while the model is still writing. */

function SiteCard({ slug, ds }: { slug: string; ds: Dataset }) {
  const p = ds.observatory.projects.find((x) => x.project.slug === slug)
  if (!p) return null
  const meta = STATUS_GROUP_META[statusGroup(p.project.status)]
  const cap = headlineCapacityMW(p)
  const facts: Array<[string, string]> = []
  if (cap) facts.push(['claimed capacity', fmtRangeMW(cap.claim)])
  const gwh = headlineEnergyGWh(p)
  if (gwh != null) facts.push(['energy / yr', `${fmtInt(gwh)} GWh`])
  const water = headlineWaterM3(p)
  if (water != null) facts.push(['water / yr', `${fmtInt(water)} m³`])
  const capex = headlineCapexGBP(p)
  if (capex != null) facts.push(['claimed investment', fmtGBP(capex)])
  const jobs = operationalJobsClaim(p)
  if (jobs != null) facts.push(['claimed jobs', fmtInt(jobs)])
  const objs = publishedObjections(p)
  if (objs != null) facts.push(['objections', `${fmtInt(objs)}+`])
  const dev = developersOf(p)[0]
  return (
    <div className="stage-site">
      <div className="stage-site-head">
        <span className="dot" style={{ background: `light-dark(${meta.color}, ${meta.colorDark})` }} />
        <strong>{p.project.display_name ?? p.project.canonical_name}</strong>
      </div>
      <div className="stage-site-sub">
        {statusLabel(p.project.status)} · {p.project.local_authority}{dev ? ` · ${dev}` : ''}
      </div>
      {facts.length > 0 && (
        <div className="stage-facts">
          {facts.slice(0, 4).map(([l, v]) => (
            <div className="stage-fact" key={l}>
              <div className="v">{v}</div>
              <div className="l">{l}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Bars({ title, rows }: { title: string; rows: Array<{ label: string; frac: number; display: string }> }) {
  const [grown, setGrown] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setGrown(true))
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <div className="stage-bars">
      <div className="stage-card-title">{title}</div>
      {rows.map((r, i) => (
        <div className="stage-bar-row" key={i}>
          <div className="stage-bar-label" title={r.label}>{r.label}</div>
          <div className="stage-bar-track">
            <div
              className="stage-bar-fill"
              style={{ width: grown ? `${Math.max(3, r.frac * 100)}%` : '0%', transitionDelay: `${120 + i * 80}ms` }}
            />
          </div>
          <div className="stage-bar-value">{r.display}</div>
        </div>
      ))}
    </div>
  )
}

function Table({ title, columns, rows }: { title: string; columns: string[]; rows: string[][] }) {
  return (
    <div className="stage-table">
      <div className="stage-card-title">{title}</div>
      <table>
        <thead>
          <tr>{columns.map((c, i) => <th key={i} className={i ? 'num' : ''}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ animationDelay: `${i * 55}ms` }}>
              {r.map((cell, j) => <td key={j} className={j ? 'num' : ''}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* Streamed text is line-oriented precisely so it can be parsed half-written:
   every complete line is renderable, and the last partial line shows as the
   one currently being typed. */
function parseLines(text: string): { done: string[]; partial: string } {
  const lines = text.split('\n')
  const partial = lines.pop() ?? ''
  return { done: lines.map((l) => l.trim()).filter(Boolean), partial: partial.trim() }
}

function stripBullet(s: string): string {
  return s.replace(/^[-•*\d.)\s]+/, '').trim()
}

function ArtifactBody({ artifact, text, status }: { artifact: ArtifactKind; text: string; status: string }) {
  const { done, partial } = parseLines(text)
  const building = status === 'building'

  if (artifact === 'table') {
    const rows = done.map((l) => l.split('|').map((c) => c.trim())).filter((r) => r.length > 1)
    const header = rows[0]
    const body = rows.slice(1).filter((r) => !/^[-\s|]+$/.test(r.join('')))
    if (!header) return <div className="stage-skeleton"><span /><span /><span /></div>
    return (
      <table className="stage-artifact-table">
        <thead><tr>{header.map((h, i) => <th key={i} className={i ? 'num' : ''}>{h}</th>)}</tr></thead>
        <tbody>
          {body.map((r, i) => (
            <tr key={i} className="row-in">
              {r.map((c, j) => <td key={j} className={j ? 'num' : ''}>{c}</td>)}
            </tr>
          ))}
          {building && partial && (
            <tr className="row-typing">
              {partial.split('|').map((c, j) => <td key={j} className={j ? 'num' : ''}>{c.trim()}</td>)}
            </tr>
          )}
        </tbody>
      </table>
    )
  }

  if (artifact === 'flow' || artifact === 'timeline') {
    const steps = done.map(stripBullet)
    return (
      <ol className={artifact === 'flow' ? 'stage-flow' : 'stage-timeline'}>
        {steps.map((s, i) => {
          const [head, ...rest] = s.split('|')
          return (
            <li key={i} className="row-in">
              <span className="step-head">{head.trim()}</span>
              {rest.length > 0 && <span className="step-body">{rest.join('|').trim()}</span>}
            </li>
          )
        })}
        {building && partial && <li className="row-typing"><span className="step-head">{stripBullet(partial)}</span></li>}
      </ol>
    )
  }

  return (
    <ul className="stage-bullets">
      {done.map((l, i) => <li key={i} className="row-in">{stripBullet(l)}</li>)}
      {building && partial && <li className="row-typing">{stripBullet(partial)}</li>}
      {building && !done.length && !partial && (
        <li className="stage-skeleton"><span /><span /><span /></li>
      )}
    </ul>
  )
}

function CardBody({ card, ds }: { card: StageCard; ds: Dataset }) {
  switch (card.kind) {
    case 'stat':
      return (
        <div className="stage-stat">
          {card.icon && <span className="stage-stat-icon" aria-hidden="true">{card.icon}</span>}
          <div>
            <div className="stage-stat-value">{card.value}</div>
            <div className="stage-stat-label">{card.label}</div>
            {card.note && <div className="stage-stat-note">{card.note}</div>}
          </div>
        </div>
      )
    case 'site': return <SiteCard slug={card.slug} ds={ds} />
    case 'bars': return <Bars title={card.title} rows={card.rows} />
    case 'table': return <Table title={card.title} columns={card.columns} rows={card.rows} />
    case 'note':
      return (
        <div className="stage-note">
          {card.title && <div className="stage-card-title">{card.icon ? `${card.icon} ` : ''}{card.title}</div>}
          <ul>{card.points.map((pt, i) => <li key={i}>{pt}</li>)}</ul>
        </div>
      )
    case 'artifact':
      return (
        <div className="stage-artifact">
          <div className="stage-card-title">
            {card.title}
            {card.status === 'building' && <span className="stage-building">building<span className="dots">…</span></span>}
            {card.status === 'failed' && <span className="stage-building failed">unavailable</span>}
          </div>
          <ArtifactBody artifact={card.artifact} text={card.text} status={card.status} />
        </div>
      )
  }
}

export default function StageOverlay({ ds }: { ds: Dataset }) {
  const staged = useStage()
  if (!staged.length) return null
  return (
    <div className="stage-overlay" aria-live="polite">
      {staged.map((s: StagedCard, i) => {
        const card = s.card
        const source = 'source' in card ? card.source : undefined
        const timed = !(card.kind === 'artifact' && card.status === 'building')
        return (
          <div
            className={`stage-card${s.leaving ? ' leaving' : ''}`}
            style={{ animationDelay: s.leaving ? '0ms' : `${i * 80}ms` }}
            key={s.id}
          >
            <CardBody card={card} ds={ds} />
            {source && <div className="stage-source">{source}</div>}
            {timed && !s.leaving && (
              <span className="stage-ttl" style={{ animationDuration: `${s.ttlMs}ms` }} aria-hidden="true" />
            )}
          </div>
        )
      })}
    </div>
  )
}
