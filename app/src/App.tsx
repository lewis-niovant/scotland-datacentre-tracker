import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { DataContext, loadDataset, type Dataset, fmtDate } from './lib/data'
import { Header, BottomNav } from './components/Nav'
import OverviewPage from './pages/OverviewPage'

const MapPage = lazy(() => import('./pages/MapPage'))
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'))
const ProjectPage = lazy(() => import('./pages/ProjectPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))

function Shell({ ds }: { ds: Dataset }) {
  const location = useLocation()
  const isMap = location.pathname === '/map'
  const legacyMapLink = location.pathname === '/' && new URLSearchParams(location.search).has('site')
  const snapshot = ds.observatory.constants?.snapshot_date ?? ds.observatory.generated_from_snapshot
  const mainRef = useRef<HTMLElement>(null)
  /* The scroll container persists across routes; reset it on navigation. */
  useEffect(() => { mainRef.current?.scrollTo(0, 0) }, [location.pathname])
  return (
    <div className="app-shell">
      <Header snapshot={snapshot} />
      {ds.geoLoadFailed && (
        <div className="data-load-warning" role="alert">
          Map outlines could not be loaded. Project records are still available, but mapped
          boundaries and location counts may be incomplete.
        </div>
      )}
      <main ref={mainRef} className={`app-main${isMap ? '' : ' scrollable'}`}>
        <Suspense fallback={<div className="loading-screen">Opening this view…</div>}>
          <Routes>
            <Route path="/" element={legacyMapLink ? <Navigate to={`/map${location.search}`} replace /> : <OverviewPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/project/:slug" element={<ProjectPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        {!isMap && (
          <footer className="app-footer">
            Scotland Data Centre Observatory · Data snapshot: {fmtDate(snapshot)} · Independent and
            evidence-led; every figure is a sourced claim, not a fact.
          </footer>
        )}
      </main>
      <BottomNav />
    </div>
  )
}

export default function App() {
  const [ds, setDs] = useState<Dataset | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadDataset()
      .then((d) => { if (!cancelled) setDs(d) })
      .catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true }
  }, [])

  if (failed) {
    return (
      <div className="error-screen">
        <strong>Could not load the Observatory dataset.</strong>
        <span>Please check your connection and reload.</span>
      </div>
    )
  }
  if (!ds) return <div className="loading-screen">Loading the Observatory…</div>

  return (
    <DataContext.Provider value={ds}>
      <HashRouter>
        <Shell ds={ds} />
      </HashRouter>
    </DataContext.Provider>
  )
}
