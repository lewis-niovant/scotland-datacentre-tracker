import type { Dataset } from '../lib/data'
import { fmtMWRange, statusGroup, sumHeadlineCapacity } from '../lib/data'
import type { StageCard } from './stage'

/** Lightweight opening figures, kept separate from the realtime SDK so the
    public map does not download the voice runtime before somebody starts it. */
export function overviewCards(ds: Dataset): StageCard[] {
  const all = ds.observatory.projects
  const capacity = sumHeadlineCapacity(all)
  const authorities = new Set(all.map((p) => p.project.local_authority).filter(Boolean)).size
  const operating = all.filter((p) => statusGroup(p.project.status) === 'operating').length
  return [
    { kind: 'stat', icon: '🗺️', value: String(all.length), label: 'data centre projects tracked in Scotland', source: 'the observatory dataset' },
    { kind: 'stat', icon: '⚡', value: fmtMWRange(capacity.minimumMw, capacity.maximumMw), label: 'capacity across records with usable facility claims', note: 'mixed definitions and evidence states; not a forecast', source: `${capacity.projects} of ${all.length} projects` },
    { kind: 'stat', icon: '🏢', value: `${operating} operating`, label: `across ${authorities} local authorities`, source: 'the observatory dataset' },
  ]
}
