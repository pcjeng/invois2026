import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { usingSupabase, getSession, getProfile, signOut, onAuthStateChange, getMyRole } from '../lib/db'

const TITLES = [
  { re: /^\/$/, title: 'Documents' },
  { re: /^\/new/, title: 'New Document' },
  { re: /^\/doc\/[^/]+$/, title: 'Edit Document' },
  { re: /^\/customers/, title: 'Customers' },
  { re: /^\/admin/, title: 'Admin' },
  { re: /^\/settings/, title: 'Settings' },
]

export default function Layout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [banner, setBanner] = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const [role, setRole] = useState('user')
  const [brand, setBrand] = useState('Invois App')
  const [drawer, setDrawer] = useState(false)
  const isHome = location.pathname === '/'
  const title = (TITLES.find((t) => t.re.test(location.pathname)) || {}).title || 'Invois App'

  useEffect(() => {
    if (!usingSupabase) return
    let unsub = () => {}
    getSession()
      .then((s) => setUserEmail(s?.user?.email || ''))
      .catch(() => {})
    getMyRole().then(setRole).catch(() => {})
    getProfile()
      .then((p) => { if (p?.name) setBrand(p.name) })
      .catch(() => {})
    onAuthStateChange((_e, s) => {
      setUserEmail(s?.user?.email || '')
      setRole(s?.user?.app_metadata?.role || 'user')
    }).catch(() => {})
    return () => unsub()
  }, [])

  async function handleLogout() {
    setDrawer(false)
    try {
      await signOut()
    } catch { /* abaikan */ }
  }

  function go(path) {
    setDrawer(false)
    navigate(path)
  }

  return (
    <>
      <header className="app-header no-print">
        {isHome ? (
          <button className="menu-btn" onClick={() => setDrawer(true)} aria-label="menu">☰</button>
        ) : (
          <button
            className="back-btn"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
            aria-label="back"
          >
            ←
          </button>
        )}
        <h1 className="app-title">{isHome ? brand.toUpperCase() : title}</h1>
        <div className="header-user">
          {usingSupabase && userEmail && (
            <>
              <span className="email" title={userEmail}>{userEmail}</span>
              <button onClick={handleLogout}>Log Keluar</button>
            </>
          )}
        </div>
      </header>

      {!usingSupabase && banner && (
        <div className="demo-banner">
          <span>Demo mode: data disimpan dalam pelayar ini sahaja. Sambungkan Supabase untuk simpanan kekal.</span>
          <button onClick={() => setBanner(false)} aria-label="tutup">✕</button>
        </div>
      )}

      {drawer && (
        <div className="drawer-overlay" onClick={() => setDrawer(false)}>
          <aside className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-brand">{brand.toUpperCase()}</div>
            <div className="drawer-user">{userEmail || 'Demo mode'}</div>
            <button className="drawer-link" onClick={() => go('/')}>🏠 Documents</button>
            <button className="drawer-link" onClick={() => go('/customers')}>👥 Customers</button>
            {role === 'admin' && <button className="drawer-link" onClick={() => go('/admin')}>🛡️ Admin</button>}
            <button className="drawer-link" onClick={() => go('/settings')}>⚙️ Settings</button>
            <div className="drawer-sep" />
            <button className="drawer-link danger" onClick={handleLogout}>🚪 Log Keluar</button>
          </aside>
        </div>
      )}

      {children}

      <nav className="bottom-nav no-print">
        <NavLink to="/" end className={({ isActive }) => 'nav-docs' + (isActive ? ' active' : '')}>
          <span className="ico">🏠</span>Home
        </NavLink>
        <NavLink to="/customers" className={({ isActive }) => 'nav-cust' + (isActive ? ' active' : '')}>
          <span className="ico">👥</span>Customers
        </NavLink>
        {role === 'admin' && (
          <NavLink to="/admin" className={({ isActive }) => 'nav-admin' + (isActive ? ' active' : '')}>
            <span className="ico">🛡️</span>Admin
          </NavLink>
        )}
        <NavLink to="/settings" className={({ isActive }) => 'nav-set' + (isActive ? ' active' : '')}>
          <span className="ico">⚙️</span>Settings
        </NavLink>
      </nav>
    </>
  )
}
