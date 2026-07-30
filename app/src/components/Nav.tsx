import { NavLink } from 'react-router-dom'
import { fmtDate } from '../lib/data'

const cls = ({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '')

export function Header({ snapshot }: { snapshot?: string }) {
  return (
    <header className="app-header">
      <NavLink to="/" className="brand">
        <strong>Scotland Data Centre Observatory</strong>
        <span>Independent, evidence-led tracking</span>
      </NavLink>
      <nav className="desktop-nav" aria-label="Primary">
        <NavLink to="/" end className={cls}>Map</NavLink>
        <NavLink to="/projects" className={cls}>Projects</NavLink>
        <NavLink to="/about" className={cls}>About</NavLink>
      </nav>
      <span className="snapshot-tag">Data snapshot: {fmtDate(snapshot)}</span>
    </header>
  )
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      <NavLink to="/" end className={cls}>
        <Icon d="M9 20l-5.5-2.2V5.3L9 7.5l6-2.8 5.5 2.2v12.5L15 17.2l-6 2.8zm0 0V7.5m6-2.8v12.5" />
        Map
      </NavLink>
      <NavLink to="/projects" className={cls}>
        <Icon d="M4 6h16M4 12h16M4 18h10" />
        Projects
      </NavLink>
      <NavLink to="/about" className={cls}>
        <Icon d="M12 8h.01M11 12h1v4h1m9-4a10 10 0 11-20 0 10 10 0 0120 0z" />
        About
      </NavLink>
    </nav>
  )
}
