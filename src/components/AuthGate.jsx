import { useEffect, useState } from 'react'
import * as api from '../lib/db'

// Skrin Auth SaaS: Log Masuk / Daftar / Lupa Kata Laluan.
// Demo mode (tiada Supabase): terus lalu tanpa login.
export default function AuthGate({ children }) {
  const [state, setState] = useState('loading') // loading | auth | ok
  const [mode, setMode] = useState('login') // login | register | forgot
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!api.authAvailable) return
    let unsub = () => {}
    api
      .getSession()
      .then((s) => setState(s ? 'ok' : 'auth'))
      .catch(() => setState('auth'))
    api
      .onAuthStateChange((_evt, session) => setState(session ? 'ok' : 'auth'))
      .then((u) => { unsub = u })
      .catch(() => {})
    return () => unsub()
  }, [])

  if (!api.authAvailable || state === 'ok') return children

  function switchMode(m) {
    setMode(m)
    setErr('')
    setInfo('')
    setPassword('')
  }

  async function handleGoogle() {
    setBusy(true)
    setErr('')
    try {
      await api.signInWithGoogle()
      // halaman akan redirect ke Google — tiada langkah seterusnya di sini
    } catch (ex) {
      setErr('Gagal: ' + (ex?.message || ex))
      setBusy(false)
    }
  }

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    setInfo('')
    try {
      if (mode === 'login') {
        await api.signIn(email.trim(), password)
      } else if (mode === 'register') {
        if (password.length < 6) throw new Error('Kata laluan sekurang-kurangnya 6 aksara.')
        const res = await api.signUp(email.trim(), password)
        if (res.needsEmailConfirm) {
          switchMode('login')
          setInfo('Daftar berjaya! Semak email awak untuk pengesahan, kemudian log masuk.')
          setBusy(false)
          return
        }
        // session terus tercipta — onAuthStateChange tukar ke 'ok'
      } else if (mode === 'forgot') {
        await api.sendPasswordReset(email.trim())
        setInfo('Email reset kata laluan dihantar. Semak inbox / spam awak.')
      }
    } catch (ex) {
      setErr((ex?.message || String(ex)).replace('AuthApiError: ', ''))
    }
    setBusy(false)
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <div className="login-logo">Invois App</div>
        <div className="login-sub">Quotation · Invoice · Receipt — akaun syarikat anda sendiri</div>

        <label htmlFor="auth-email">Email</label>
        <input
          id="auth-email"
          type="email"
          autoComplete="username"
          placeholder="nama@syarikat.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {mode !== 'forgot' && (
          <>
            <label htmlFor="auth-password">Kata Laluan</label>
            <input
              id="auth-password"
              type="password"
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              placeholder={mode === 'register' ? 'Sekurang-kurangnya 6 aksara' : '••••••••'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={mode === 'register' ? 6 : undefined}
            />
          </>
        )}

        {err && <div className="login-err">{err}</div>}
        {info && <div className="login-info">{info}</div>}

        <button className="btn gold" type="submit" disabled={busy}>
          {busy
            ? 'Sedang diproses…'
            : mode === 'login'
              ? 'Log Masuk'
              : mode === 'register'
                ? 'Daftar Akaun'
                : 'Hantar Email Reset'}
        </button>

        <button className="btn google-btn" type="button" onClick={handleGoogle} disabled={busy}>
          <span className="g-icon">G</span> Log masuk dengan Google
        </button>

        <div className="login-links">
          {mode === 'login' && (
            <>
              <button type="button" className="linklike" onClick={() => switchMode('register')}>
                Tiada akaun? <b>Daftar</b>
              </button>
              <button type="button" className="linklike" onClick={() => switchMode('forgot')}>
                Lupa kata laluan?
              </button>
            </>
          )}
          {mode !== 'login' && (
            <button type="button" className="linklike" onClick={() => switchMode('login')}>
              ← Kembali log masuk
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
