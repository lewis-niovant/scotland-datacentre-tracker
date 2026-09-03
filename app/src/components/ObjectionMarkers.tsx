import { useEffect, useRef, useState } from 'react'
import { Marker, Popup, type Map as MapLibreMap } from 'maplibre-gl'
import type { ProjectRecord, SourceEntry } from '../types'
import { fmtInt, projectCoords, publishedObjections } from '../lib/data'
import { hasObjectionStory } from '../lib/communityStories'

/* Objection markers: a megaphone bubble offset from each site dot, opening the
   concerns communities actually raised — who raised them, what the developer
   said back, and a link out to every source.

   Everything here is quoted from the record. Nothing is characterised, ranked or
   summarised by the app: the point is to surface opposition that was previously
   buried three clicks deep in a profile page, not to editorialise about it. */

function bubbleHTML(p: ProjectRecord): string {
  const n = publishedObjections(p)
  const concerns = p.community?.principal_concerns?.length ?? 0
  /* The count is a portal minimum where we have one; otherwise fall back to how
     many distinct concerns are on the record, which is a different thing and is
     labelled differently. */
  const value = n != null ? `${fmtInt(n)}+` : `${concerns}`
  const cls = n != null && n >= 500 ? ' loud' : ''
  return `<span class="obj-icon${cls}" aria-hidden="true">📣</span>`
    + `<span class="obj-count">${value}</span>`
}

function ariaFor(p: ProjectRecord): string {
  const n = publishedObjections(p)
  const concerns = p.community?.principal_concerns?.length ?? 0
  const name = p.project.display_name ?? p.project.canonical_name
  return n != null
    ? `${fmtInt(n)} or more published objections to ${name}, across ${concerns} recorded concerns. Activate to read them.`
    : `${concerns} recorded community concerns about ${name}. Activate to read them.`
}

function el(tag: string, cls?: string, text?: string): HTMLElement {
  const e = document.createElement(tag)
  if (cls) e.className = cls
  if (text) e.textContent = text
  return e
}

function popupContent(p: ProjectRecord, sources: Record<string, SourceEntry>): HTMLElement {
  const root = el('div', 'obj-pop')
  const name = p.project.display_name ?? p.project.canonical_name
  const n = publishedObjections(p)
  const c = p.community

  root.append(el('strong', 'obj-pop-title', name))
  if (n != null) {
    root.append(el('p', 'obj-pop-count',
      `${fmtInt(n)}+ published objections — a planning-portal minimum, not a total.`))
  }
  const groups = c?.campaign_groups ?? []
  if (groups.length) {
    root.append(el('p', 'obj-pop-groups', `Campaigning: ${groups.join(' · ')}`))
  }

  const list = el('ul', 'obj-list')
  for (const concern of c?.principal_concerns ?? []) {
    const li = el('li')
    li.append(el('p', 'obj-concern', concern.concern))
    if (concern.raised_by) li.append(el('p', 'obj-by', `Raised by ${concern.raised_by}`))
    if (concern.developer_response) {
      li.append(el('p', 'obj-response', `Developer: ${concern.developer_response}`))
    }
    /* Every concern carries its sources as real links, opening in a new tab —
       a reader should never have to take the app's word for a quote. */
    const ids = (concern.source_ids ?? []).filter((id) => sources[id]?.url)
    if (ids.length) {
      const cite = el('p', 'obj-cite')
      ids.forEach((id, i) => {
        const s = sources[id]
        const a = document.createElement('a')
        a.href = s.url as string
        a.target = '_blank'
        a.rel = 'noreferrer'
        a.textContent = s.title ?? id
        if (i > 0) cite.append(document.createTextNode(' · '))
        cite.append(a)
      })
      li.append(cite)
    }
    list.append(li)
  }
  root.append(list)
  return root
}

/* Below this the sites are still clustered into donuts, and 19 megaphones sit on
   top of each other — unreadable, and they intercept each other's clicks. They
   appear as the cluster breaks up, the same way individual dots do.

   There is deliberately no on/off button for these any more: objections are part
   of the record, and they surface by themselves as the reader gets close enough
   for them to be legible. */
const OBJECTION_MIN_ZOOM = 9.2

interface Props {
  map: MapLibreMap | null
  ready: boolean
  projects: ProjectRecord[]
  sources: Record<string, SourceEntry>
  /** Slug whose bubble should be opened programmatically (used by the tour). */
  openFor?: string | null
}

export default function ObjectionMarkers({
  map, ready, projects, sources, openFor,
}: Props) {
  const markersRef = useRef(new Map<string, Marker>())
  const popupRef = useRef<Popup | null>(null)
  const [zoomedIn, setZoomedIn] = useState(false)

  /* Track the zoom so the bubbles can come and go with it. */
  useEffect(() => {
    if (!map) return
    const read = () => setZoomedIn(map.getZoom() >= OBJECTION_MIN_ZOOM)
    read()
    map.on('zoomend', read)
    map.on('moveend', read)
    return () => { map.off('zoomend', read); map.off('moveend', read) }
  }, [map])

  useEffect(() => {
    if (!map || !ready) return
    const live = new Set<string>()

    if (zoomedIn) {
      for (const p of projects) {
        if (!hasObjectionStory(p)) continue
        const coords = projectCoords(p)
        if (!coords) continue
        const slug = p.project.slug
        live.add(slug)
        if (markersRef.current.has(slug)) continue

        const button = document.createElement('button')
        button.type = 'button'
        button.className = 'obj-bubble'
        button.innerHTML = bubbleHTML(p)
        button.setAttribute('aria-label', ariaFor(p))
        button.addEventListener('click', (ev) => {
          ev.stopPropagation()
          popupRef.current?.remove()
          popupRef.current = new Popup({
            closeButton: true, closeOnClick: false, maxWidth: '340px', className: 'obj-popup',
          })
            .setLngLat(coords)
            .setDOMContent(popupContent(p, sources))
            .addTo(map)
        })
        /* Offset up-left so the bubble never sits on the site dot it belongs to,
           and so a cluster of sites still reads as separate stories. */
        markersRef.current.set(slug, new Marker({ element: button, offset: [-16, -26] })
          .setLngLat(coords).addTo(map))
      }
    }

    for (const [slug, m] of markersRef.current) {
      if (!live.has(slug)) { m.remove(); markersRef.current.delete(slug) }
    }
  }, [map, ready, projects, sources, zoomedIn])

  /* The guided tour opens one bubble without a click. The marker it wants only
     exists once the beat's camera has flown far enough in, so wait for the
     zoom that creates it rather than firing into an empty map.

     The cleanup closes it again: without that, the popup the tour opened on the
     objections beat stayed pinned to the map for the rest of the session, over
     every later beat and over the map afterwards. */
  useEffect(() => {
    if (!map || !openFor || !zoomedIn) return
    const t = window.setTimeout(
      () => markersRef.current.get(openFor)?.getElement().click(), 60,
    )
    return () => {
      window.clearTimeout(t)
      popupRef.current?.remove()
      popupRef.current = null
    }
  }, [map, openFor, zoomedIn])

  /* Zooming out removes the bubbles; an open popup must not outlive its bubble. */
  useEffect(() => {
    if (zoomedIn) return
    popupRef.current?.remove()
    popupRef.current = null
  }, [zoomedIn])

  /* Clicking the map anywhere else dismisses it, like every other map popup. */
  useEffect(() => {
    if (!map) return
    const close = () => { popupRef.current?.remove(); popupRef.current = null }
    map.on('click', close)
    return () => { map.off('click', close) }
  }, [map])

  useEffect(() => () => {
    for (const [, m] of markersRef.current) m.remove()
    markersRef.current.clear()
    popupRef.current?.remove()
  }, [])

  return null
}
