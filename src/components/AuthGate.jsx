import { useEffect, useState } from 'react'
import * as api from '../lib/db'

// Gerbang login: kalau Supabase Auth dikonfigur, skrin ini menghalang akses
// sehingga admin log masuk. Dalam demo mode (tiada Supabase), terus lalu.
export default function AuthGate({ children }) {
  const [state, setState] = useState('loading') // loading | login | ok
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!api.authAvailable) return
    let unsub = () => {}
    api
      .getSession()
      .then((s) => setState(s ? 'ok' : 'login'))
      .catch(() => setState('login'))
    api
      .onAuthStateChange((_evt, session) => setState(session ? 'ok' : 'login'))
      .then((u) => { unsub = u })
      .catch(() => {})
    return () => unsub()
  }, [])

  if (!api.authAvailable || state === 'ok') return children

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      await api.signIn(email.trim(), password)
      // onAuthStateChange akan tukar state ke 'ok'
    } catch (ex) {
      setErr('Login gagal: ' + (ex?.message || ex))
    }
    setBusy(false)
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <div className="login-logo">Invois App</div>
        <div className="login-sub">Quotation · Invoice · Receipt</div>

        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          autoComplete="username"
          placeholder="admin@contoh.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label htmlFor="login-password">Kata Laluan</label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {err && <div className="login-err">{err}</div>}

        <button className="btn gold" type="submit" disabled={busy}>
          {busy ? 'Sedang log masuk…' : 'Log Masuk'}
        </button>

        <p className="login-note">
          Akaun admin dibuat dalam Supabase Dashboard → Authentication → Users.
        </p>
      </form>
    </div>
  )
}
