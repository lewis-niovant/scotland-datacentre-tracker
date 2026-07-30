import { useState } from 'react'

const STORAGE_KEY = 'sdo-intro-dismissed-v1'

export function introDismissed(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === '1' } catch { return false }
}

function remember() {
  try { localStorage.setItem(STORAGE_KEY, '1') } catch { /* private mode */ }
}

const STEPS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21s-6.5-5.4-6.5-10A6.5 6.5 0 0112 4.5 6.5 6.5 0 0118.5 11c0 4.6-6.5 10-6.5 10z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <circle cx="12" cy="11" r="2.4" fill="currentColor" />
      </svg>
    ),
    title: 'Tap a marker',
    text: 'Each dot is a proposed or existing data centre. Tap one for the story; numbered circles group nearby sites — tap to zoom in.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M13 2L4.5 13.5H11L10 22l8.5-11.5H12L13 2z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Switch lenses',
    text: 'Use the lens bar to see the same sites by electricity, water, money or planning status.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3l7 2.8v5c0 4.5-3 7.9-7 10.2-4-2.3-7-5.7-7-10.2v-5L12 3z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M9 11.5l2.2 2.2 3.8-4.2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Every figure is a claim',
    text: 'Chips like “developer-stated” or “verified” show how much weight each number can bear.',
  },
]

export default function IntroOverlay({ onDismiss }: { onDismiss: () => void }) {
  const [leaving, setLeaving] = useState(false)
  const dismiss = () => {
    remember()
    setLeaving(true)
    window.setTimeout(onDismiss, 240)
  }
  return (
    <div className={`intro-scrim${leaving ? ' leaving' : ''}`} role="dialog" aria-modal="true" aria-labelledby="intro-title">
      <div className="intro-card">
        <button className="intro-skip" onClick={dismiss} aria-label="Dismiss introduction">✕</button>
        <p className="intro-kicker">Scotland Data Centre Observatory</p>
        <h2 id="intro-title">Scotland is facing a wave of proposed data centres.</h2>
        <p className="intro-sub">39 projects tracked, from operating halls to gigawatt-scale concepts — every figure sourced, none taken on trust.</p>
        <ol className="intro-steps">
          {STEPS.map((s) => (
            <li key={s.title}>
              <span className="intro-icon">{s.icon}</span>
              <span>
                <strong>{s.title}</strong>
                <small>{s.text}</small>
              </span>
            </li>
          ))}
        </ol>
        <button className="intro-cta" onClick={dismiss}>Explore the map</button>
      </div>
    </div>
  )
}
