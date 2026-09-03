import { useCallback, useEffect, useRef, useState } from 'react'
import type { Map as MapLibreMap } from 'maplibre-gl'
import type { ProjectRecord } from '../types'
import {
  buildScript, rememberIntroDismissed, type Beat, type TourState,
} from '../lib/guidedTour'

/* The guided tour: a short, manual scripted flight that shows what the map can
   do by doing it, rather than describing it in a card of tips.

   Each beat declares the state it wants — camera, filters, overlays — and the
   page applies it. The tour never holds state the user cannot then change: when
   it ends, whatever is on screen is a live map they now know how to drive.

   Every number quoted is read from the dataset at runtime, so the script cannot
   drift away from the data the way hardcoded copy would. */

interface Props {
  projects: ProjectRecord[]
  /** Slugs with an official red line, used to pick the headline site. */
  boundarySlugs: Set<string>
  map: MapLibreMap | null
  onState: (s: TourState) => void
  onDone: () => void
}

export default function GuidedTour({ projects, boundarySlugs, map, onState, onDone }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const scriptRef = useRef<Beat[]>(buildScript(projects, boundarySlugs))
  const script = scriptRef.current
  const [i, setI] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const onStateRef = useRef(onState)
  onStateRef.current = onState
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  const beat = script[i]
  const last = i >= script.length - 1

  const finish = useCallback(() => {
    rememberIntroDismissed()
    setLeaving(true)
    window.setTimeout(() => onDoneRef.current(), 260)
  }, [])

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') finish()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previousFocus?.focus()
    }
  }, [finish])

  /* Apply this beat's state, then move the camera. */
  useEffect(() => {
    if (!beat) return
    onStateRef.current(beat.state)
    if (!map) return
    const c = beat.state.camera
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (c.national) {
      map.easeTo({ pitch: 0, duration: reduceMotion ? 0 : 900 })
      map.fitBounds([[-7.9, 54.6], [-0.6, 60.95]], {
        padding: { top: 190, bottom: 130, left: 44, right: 60 }, duration: reduceMotion ? 0 : 1400,
      })
    } else if (c.center) {
      map.easeTo({
        center: c.center, zoom: c.zoom ?? 13, pitch: c.pitch ?? 0,
        duration: reduceMotion ? 0 : 1900, essential: false,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, map])

  if (!beat) return null

  return (
    <div
      ref={dialogRef}
      className={`tour${leaving ? ' leaving' : ''}`}
      role="dialog"
      aria-live="polite"
      aria-label="Manual guided introduction"
    >
      <div className="tour-card">
        <div className="tour-progress" aria-hidden="true">
          {script.map((_, n) => (
            <span key={n} className={n === i ? 'on' : n < i ? 'done' : ''} />
          ))}
        </div>
        <p className="tour-kicker">{beat.kicker}</p>
        <h2>{beat.title}</h2>
        <p className="tour-body">{beat.body}</p>
        <div className="tour-actions">
          <button className="tour-skip" onClick={finish}>
            {last ? 'Close' : 'Skip intro'}
          </button>
          {!last && (
            <button className="tour-next" onClick={() => setI((v) => v + 1)}>
              Next →
            </button>
          )}
          {last && <button className="tour-next" onClick={finish}>Explore the map</button>}
        </div>
      </div>
    </div>
  )
}
