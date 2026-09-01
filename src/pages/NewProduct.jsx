import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../lib/db'

// Borang "New Product" — ikut paparan rujukan: medan detail + butang Submit biru.
// Produk disimpan dalam katalog Saved Items (boleh ditambah ke dokumen kemudian).
export default function NewProduct() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', desc: '', unit: '', price: '' })
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  async function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setMsg('Name diperlukan.'); return }
    setBusy(true)
    try {
      const desc = form.desc.trim()
      await api.saveSavedItem({
        description: desc ? `${form.name.trim()} — ${desc}` : form.name.trim(),
        unit: form.unit.trim(),
        unit_price: Number(form.price) || 0,
      })
      navigate('/settings')
    } catch (ex) {
      setMsg('Gagal simpan: ' + (ex?.message || ex))
      setBusy(false)
    }
  }

  return (
    <div className="page">
      {msg && <div className="alert">{msg}</div>}
      <div className="section-h">Products Details</div>
      <div className="card">
        <form onSubmit={submit}>
          <div className="row col">
            <div className="stack">
              <input placeholder="Name *" value={form.name} onChange={(e) => set('name', e.target.value)} />
              <input placeholder="Description" value={form.desc} onChange={(e) => set('desc', e.target.value)} />
              <div className="two-col">
                <input placeholder="Unit (pcs / jam / unit)" value={form.unit} onChange={(e) => set('unit', e.target.value)} />
                <input type="number" step="0.01" min="0" placeholder="Price (RM)" value={form.price} onChange={(e) => set('price', e.target.value)} />
              </div>
              <button className="btn-submit" type="submit" disabled={busy}>
                {busy ? 'Menyimpan…' : 'Submit'}
              </button>
              <p className="upload-hint" style={{ margin: 0 }}>
                Selepas Submit, produk masuk katalog Saved Items — boleh ditambah ke mana-mana dokumen melalui butang ★ Saved Items.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
