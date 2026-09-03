import { useSyncExternalStore } from 'react'
import { trace } from './trace'

/* The stage: what the voice agent puts on screen while it talks.

   Two lessons drove this version. Cards that appeared and vanished on their
   own read as random, so every card now carries a `source` line saying where
   it came from, and shows a thin timer so its exit is expected rather than
   startling. And an artifact that takes seconds to write should not appear
   only when finished — it opens as a skeleton and fills in as the text
   streams, which is the point of the thing. */

export type ArtifactKind = 'bullets' | 'table' | 'flow' | 'timeline'

export type StageCard =
  | { kind: 'stat'; icon?: string; value: string; label: string; note?: string; source?: string }
  | { kind: 'site'; slug: string; source?: string }
  | { kind: 'bars'; title: string; rows: Array<{ label: string; frac: number; display: string }>; source?: string }
  | { kind: 'note'; icon?: string; title?: string; points: string[]; source?: string }
  | { kind: 'table'; title: string; columns: string[]; rows: string[][]; source?: string }
  | {
      kind: 'artifact'
      artifact: ArtifactKind
      title: string
      /** Raw streamed text so far; parsed for display on every frame. */
      text: string
      status: 'building' | 'ready' | 'failed'
      source?: string
    }

export interface StagedCard {
  id: number
  card: StageCard
  /** Milliseconds this card is scheduled to live, for the timer bar. */
  ttlMs: number
  leaving?: boolean
}

const DEFAULT_TTL_MS = 34000
const LEAVE_MS = 480
const MAX_CARDS = 3

let seq = 0
let staged: StagedCard[] = []
const timers = new Map<number, number>()
const listeners = new Set<() => void>()

function emit() { for (const l of listeners) l() }

function describe(card: StageCard): string {
  return card.kind === 'site' ? `site:${card.slug}`
    : card.kind === 'artifact' ? `artifact:${card.artifact}:${card.title}`
    : 'title' in card && card.title ? `${card.kind}:${card.title}`
    : card.kind === 'stat' ? `stat:${card.label}`
    : card.kind
}

function beginLeave(id: number) {
  const c = staged.find((s) => s.id === id)
  if (!c || c.leaving) return
  trace('card_out', describe(c.card))
  staged = staged.map((s) => (s.id === id ? { ...s, leaving: true } : s))
  emit()
  window.clearTimeout(timers.get(id))
  timers.set(id, window.setTimeout(() => {
    staged = staged.filter((s) => s.id !== id)
    timers.delete(id)
    emit()
  }, LEAVE_MS))
}

function schedule(id: number, ttlMs: number) {
  window.clearTimeout(timers.get(id))
  timers.set(id, window.setTimeout(() => beginLeave(id), ttlMs))
}

function trim() {
  const alive = staged.filter((s) => !s.leaving)
  for (let i = 0; i < alive.length - MAX_CARDS; i++) beginLeave(alive[i].id)
}

export function presentCards(cards: StageCard[], opts?: { ttlMs?: number; replace?: boolean }): number[] {
  const ttl = opts?.ttlMs ?? DEFAULT_TTL_MS
  if (opts?.replace) for (const s of [...staged]) beginLeave(s.id)
  const ids: number[] = []
  for (const card of cards) {
    /* A fresh card about the same site supersedes the old one. */
    if (card.kind === 'site') {
      for (const s of staged) if (s.card.kind === 'site' && s.card.slug === card.slug) beginLeave(s.id)
    }
    const id = ++seq
    staged = [...staged, { id, card, ttlMs: ttl }]
    schedule(id, ttl)
    ids.push(id)
    trace('card_in', describe(card), { ttlMs: ttl })
  }
  trim()
  emit()
  return ids
}

/* ---------- streaming artifacts ---------- */

/** Opens an artifact card immediately in its skeleton state. */
export function openArtifact(artifact: ArtifactKind, title: string, source?: string): number {
  const id = ++seq
  const card: StageCard = { kind: 'artifact', artifact, title, text: '', status: 'building', source }
  staged = [...staged, { id, card, ttlMs: 90000 }]
  schedule(id, 90000)
  trace('card_in', describe(card), { streaming: true })
  trim()
  emit()
  return id
}

export function updateArtifact(id: number, text: string): void {
  const s = staged.find((x) => x.id === id)
  if (!s || s.card.kind !== 'artifact') return
  staged = staged.map((x) => (x.id === id ? { ...x, card: { ...(x.card as Extract<StageCard, { kind: 'artifact' }>), text } } : x))
  emit()
}

export function finishArtifact(id: number, status: 'ready' | 'failed' = 'ready', ttlMs = 45000): void {
  const s = staged.find((x) => x.id === id)
  if (!s || s.card.kind !== 'artifact') return
  staged = staged.map((x) => (x.id === id
    ? { ...x, ttlMs, card: { ...(x.card as Extract<StageCard, { kind: 'artifact' }>), status } }
    : x))
  trace('note', 'artifact_done', { status })
  schedule(id, ttlMs)
  emit()
}

export function clearStage(): void {
  for (const s of [...staged]) beginLeave(s.id)
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => { listeners.delete(cb) }
}

export function useStage(): StagedCard[] {
  return useSyncExternalStore(subscribe, () => staged)
}
