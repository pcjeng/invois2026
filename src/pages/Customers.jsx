import { useEffect, useState } from 'react'
import * as api from '../lib/db'

const EMPTY = { name: '', address: '', phone: '', email: '' }

export default function Customers() {
  const [list, setList] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [msg, setMsg] = useState('')

  async function load() {
    try {
      setList(await api.listCustomers())
    } catch (e) {
      setMsg('Gagal load: ' + (e.message || e))
    }
  }
  useEffect(() => { load() }, [])

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  async function onSave(e) {
    e.preventDefault()
    if (!form.name.trim()) { setMsg('Nama diperlukan.'); return }
    try {
      await api.saveCustomer(editingId ? { ...form, id: editingId } : form)
      setForm(EMPTY)
      setEditingId(null)
      setMsg('')
      load()
    } catch (err) {
      setMsg('Gagal simpan: ' + (err.message || err))
    }
  }

  function edit(c) {
    setEditingId(c.id)
    setForm({ name: c.name || '', address: c.address || '', phone: c.phone || '', email: c.email || '' })
  }

  return (
    <div className="page">
      {msg && <div className="alert">{msg}</div>}

      <div className="card">
        <form onSubmit={onSave}>
          <div className="row col">
            <span>{editingId ? 'Edit Customer' : 'Customer Baru'}</span>
            <div className="stack">
              <input placeholder="Nama *" value={form.name} onChange={(e) => set('name', e.target.value)} />
              <input placeholder="Address" value={form.address} onChange={(e) => set('address', e.target.value)} />
              <div className="two-col">
                <input placeholder="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
                <input placeholder="Email" value={form.email} onChange={(e) => set('email', e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn primary" type="submit">{editingId ? 'Update' : 'Tambah'}</button>
                {editingId && (
                  <button className="btn" type="button" onClick={() => { setEditingId(null); setForm(EMPTY) }}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>

      {list.length === 0 && <p style={{ color: 'var(--muted)' }}>Tiada customer lagi.</p>}
      {list.map((c) => (
        <div className="card" key={c.id}>
          <div className="row col">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>{c.name}</strong>
              <span style={{ display: 'flex', gap: 6 }}>
                <button className="btn small" onClick={() => edit(c)}>✏️</button>
                <button
                  className="btn small danger"
                  onClick={async () => {
                    if (confirm(`Delete ${c.name}?`)) {
                      await api.deleteCustomer(c.id)
                      load()
                    }
                  }}
                >
                  🗑
                </button>
              </span>
            </div>
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>
              {[c.address, c.phone, c.email].filter(Boolean).join(' · ')}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
