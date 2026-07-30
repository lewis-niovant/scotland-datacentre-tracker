import {
  MATURITY_META, STATUS_GROUP_META, stateLabel, statusGroup, statusLabel,
} from '../lib/data'

/** Status badge: colour dot + text label (never colour alone). */
export function StatusBadge({ status }: { status?: string }) {
  const g = statusGroup(status)
  const meta = STATUS_GROUP_META[g]
  return (
    <span className="badge" title={`Status group: ${meta.label}`}>
      <span className="dot" style={{ background: `light-dark(${meta.color}, ${meta.colorDark})` }} />
      {statusLabel(status)}
    </span>
  )
}

export function MaturityBadge({ level }: { level?: string }) {
  const meta = level ? MATURITY_META[level] : undefined
  if (!meta) return null
  return <span className="badge" title={meta.explanation}>{meta.label}</span>
}

/** Uncertainty-state chip, e.g. "developer-stated". */
export function StateChip({ state }: { state?: string }) {
  if (!state) return null
  return <span className={`state-chip ${state}`}>{stateLabel(state)}</span>
}

export function TierChip({ tier }: { tier?: number }) {
  if (!tier) return null
  return <span className="tier-chip">Tier {tier}</span>
}
