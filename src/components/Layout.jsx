import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { usingSupabase } from '../lib/db'

const TITLES = [
  { re: /^\/$/, title: 'Documents' },
  { re: /^\/new/, title: 'New Document' },
  { re: /^\/doc\/[^/]+$/, title: 'Edit Document' },
  { re: /^\/customers/, title: 'Customers' },
  { re: /^\/settings/, title: 'Settings' },
]

export default function Layout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [banner, setBanner] = useState(true)
  const title = (TITLES.find((t) => t.re.test(location.pathname)) || {}).title || 'Invois App'

  return (
    <>
      <header className="app-header no-print">
        <button
          className="back-btn"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
          aria-label="back"
        >
          ←
        </button>
        <h1>{title}</h1>
      </header>

      {!usingSupabase && banner && (
        <div className="demo-banner">
          <span>Demo mode: data disimpan dalam pelayar ini sahaja. Sambungkan Supabase untuk simpanan kekal.</span>
          <button onClick={() => setBanner(false)} aria-label="tutup">✕</button>
        </div>
      )}

      {children}

      <nav className="bottom-nav no-print">
        <NavLink to="/" end><span className="ico">📄</span>Documents</NavLink>
        <NavLink to="/customers"><span className="ico">👥</span>Customers</NavLink>
        <NavLink to="/settings"><span className="ico">⚙️</span>Settings</NavLink>
      </nav>
    </>
  )
}
