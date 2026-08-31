import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { usingSupabase, getSession, signOut, onAuthStateChange, getMyRole } from '../lib/db'

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
  const [userEmail, setUserEmail] = useState('')
  const [role, setRole] = useState('user')
  const title = (TITLES.find((t) => t.re.test(location.pathname)) || {}).title || 'Invois App'

  useEffect(() => {
    if (!usingSupabase) return
    let unsub = () => {}
    getSession()
      .then((s) => setUserEmail(s?.user?.email || ''))
      .catch(() => {})
    getMyRole().then(setRole).catch(() => {})
    onAuthStateChange((_e, s) => {
      setUserEmail(s?.user?.email || '')
      setRole(s?.user?.app_metadata?.role || 'user')
    }).catch(() => {})
    return () => unsub()
  }, [])

  async function handleLogout() {
    try {
      await signOut()
    } catch { /* abaikan */ }
  }

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
        {usingSupabase && userEmail && (
          <div className="header-user">
            <span className="email" title={userEmail}>{userEmail}</span>
            <button onClick={handleLogout}>Log Keluar</button>
          </div>
        )}
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
        {role === 'admin' && <NavLink to="/admin"><span className="ico">🛡️</span>Admin</NavLink>}
        <NavLink to="/settings"><span className="ico">⚙️</span>Settings</NavLink>
      </nav>
    </>
  )
}
