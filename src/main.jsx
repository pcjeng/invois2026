import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './styles.css'

// === Perlindungan skrin putih selepas deploy ===
// Jika fail chunk lama hilang (deploy baharu), muat semula halaman sekali
// supaya browser ambil index.html + bundel terkini (SW autoUpdate).
window.addEventListener('error', (e) => {
  const msg = String(e?.message || '')
  if (
    /Failed to fetch dynamically imported module|Loading chunk|error loading dynamically/i.test(msg) &&
    !sessionStorage.getItem('pwa_chunk_reload')
  ) {
    sessionStorage.setItem('pwa_chunk_reload', '1')
    window.location.reload()
  }
})
window.addEventListener('unhandledrejection', (e) => {
  const msg = String(e?.reason?.message || '')
  if (
    /Failed to fetch dynamically imported module|Loading chunk/i.test(msg) &&
    !sessionStorage.getItem('pwa_chunk_reload')
  ) {
    sessionStorage.setItem('pwa_chunk_reload', '1')
    window.location.reload()
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)
