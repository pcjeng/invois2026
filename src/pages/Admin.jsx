import { useEffect, useState } from 'react'
import * as api from '../lib/db'

// Halaman Admin: senarai pengguna, peranan, ban/unban + statistik ringkas.
// Akses ditapis dua kali: menu hanya muncul untuk admin, dan RPC Supabase
// menolak jika bukan admin.
export default function Admin() {
  const [role, setRole] = useState(null) // null = loading
  const [rows, setRows] = useState(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    api.getMyRole().then(setRole).catch(() => setRole('user'))
    load()
  }, [])

  async function load() {
    try {
      setRows(await api.adminListUsers())
      setMsg('')
    } catch (e) {
      setRows([])
      setMsg(e?.message || String(e))
    }
  }

  async function act(fn, a, b) {
    try {
      await fn(a, b)
      await load()
    } catch (e) {
      setMsg(e?.message || String(e))
    }
  }

  if (role === null) return <div className="page"><p style={{ color: 'var(--muted)' }}>Loading…</p></div>
  if (role !== 'admin') {
    return (
      <div className="page">
        <div className="alert">Halaman ini untuk ADMIN sahaja.</div>
      </div>
    )
  }

  const totalUsers = rows ? rows.length : 0
  const totalDocs = rows ? rows.reduce((s, r) => s + Number(r.doc_count || 0), 0) : 0
  const totalBanned = rows ? rows.filter((r) => r.is_banned).length : 0

  return (
    <div className="page">
      <div className="section-h">Panel Admin</div>

      <div className="admin-stats">
        <div className="admin-stat"><b>{totalUsers}</b>Pengguna</div>
        <div className="admin-stat"><b>{totalDocs}</b>Dokumen</div>
        <div className="admin-stat"><b>{totalBanned}</b>Diban</div>
      </div>

      {msg && <div className="alert">{msg}</div>}
      {rows === null && <p style={{ color: 'var(--muted)' }}>Loading…</p>}

      {rows && (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Peranan</th>
                <th>Dokumen</th>
                <th>Daftar</th>
                <th>Login Terakhir</th>
                <th>Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.uid} style={r.is_banned ? { opacity: 0.5 } : undefined}>
                  <td>{r.user_email || '(tiada email)'}</td>
                  <td>
                    <span className={'role-chip' + (r.role_name === 'admin' ? '' : ' user')}>
                      {r.role_name === 'admin' ? 'ADMIN' : 'USER'}
                    </span>
                  </td>
                  <td>{r.doc_count}</td>
                  <td>{r.joined_at ? new Date(r.joined_at).toLocaleDateString('en-MY') : '—'}</td>
                  <td>{r.last_login ? new Date(r.last_login).toLocaleDateString('en-MY') : 'Belum pernah'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {r.role_name === 'admin' ? (
                      <button className="btn small" onClick={() => act(api.adminSetRole, r.uid, 'user')}>Jadikan User</button>
                    ) : (
                      <button className="btn small" onClick={() => act(api.adminSetRole, r.uid, 'admin')}>Jadikan Admin</button>
                    )}{' '}
                    {r.is_banned ? (
                      <button className="btn small" onClick={() => act(api.adminSetBanned, r.uid, false)}>Unban</button>
                    ) : (
                      <button
                        className="btn small danger"
                        onClick={() => { if (confirm(`Ban ${r.user_email}?`)) act(api.adminSetBanned, r.uid, true) }}
                      >
                        Ban
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} style={{ color: 'var(--muted)' }}>Tiada pengguna berdaftar lagi.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
