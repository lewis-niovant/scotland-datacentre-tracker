import type { ReactElement } from 'react'
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

/* Credibility cue: icon + label, used consistently across sheet, list,
   profile. Icon shape differs per level so colour never carries it alone. */
const VERIFICATION_META: Record<string, { label: string; title: string; cls: string; icon: ReactElement }> = {
  verified: {
    label: 'Verified',
    title: 'Checked against official records (planning portal, Companies House or grid register).',
    cls: 'verified',
    icon: (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M8 1.5l5 2v3.6c0 3.2-2.1 5.6-5 7.4-2.9-1.8-5-4.2-5-7.4V3.5l5-2z" fill="currentColor" opacity="0.18" />
        <path d="M8 1.5l5 2v3.6c0 3.2-2.1 5.6-5 7.4-2.9-1.8-5-4.2-5-7.4V3.5l5-2z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M5.6 8l1.7 1.7 3.1-3.4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  reported: {
    label: 'Reported',
    title: 'Described in credible journalism or developer material, but not yet matched to an official record.',
    cls: 'reported',
    icon: (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <rect x="2.2" y="3" width="11.6" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M4.6 6h6.8M4.6 8.5h6.8M4.6 11h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  unverifiable: {
    label: 'Unverifiable',
    title: 'No official record located; the claim cannot currently be verified.',
    cls: 'unverifiable',
    icon: (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="6.3" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M6.1 6.2c.2-1 1-1.6 2-1.6 1.1 0 1.9.8 1.9 1.8 0 1.4-1.9 1.5-1.9 2.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="8" cy="11.6" r="0.9" fill="currentColor" />
      </svg>
    ),
  },
}

export function VerificationBadge({ level, compact }: { level?: string; compact?: boolean }) {
  if (!level) return null
  const meta = VERIFICATION_META[level] ?? {
    label: level, title: level, cls: 'reported', icon: VERIFICATION_META.reported.icon,
  }
  return (
    <span className={`verif-badge ${meta.cls}`} title={meta.title}>
      {meta.icon}
      {!compact && meta.label}
    </span>
  )
}
