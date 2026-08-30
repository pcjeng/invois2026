import { useEffect, useState } from 'react'
import * as api from '../lib/db'
import { fmtMoney } from '../lib/format'

const EMPTY_PROFILE = { name: '', address: '', phone: '', email: '', logo_url: '', signature_url: '', default_tax_rate: 0 }
const EMPTY_ITEM = { description: '', unit: '', unit_price: 0 }

export default function Settings() {
  const [profile, setProfile] = useState(EMPTY_PROFILE)
  const [items, setItems] = useState([])
  const [itemForm, setItemForm] = useState(EMPTY_ITEM)
  const [editingItemId, setEditingItemId] = useState(null)
  const [msg, setMsg] = useState('')
  const [savedOk, setSavedOk] = useState(false)

  useEffect(() => {
    api.getProfile().then((p) => { if (p) setProfile({ ...EMPTY_PROFILE, ...p }) }).catch(() => {})
    loadItems()
  }, [])

  async function loadItems() {
    try { setItems(await api.listSavedItems()) } catch { setItems([]) }
  }

  function setP(k, v) { setProfile((p) => ({ ...p, [k]: v })) }

  async function saveProfile(e) {
    e.preventDefault()
    try {
      const saved = await api.saveProfile(profile)
      setProfile({ ...EMPTY_PROFILE, ...saved })
      setSavedOk(true)
      setTimeout(() => setSavedOk(false), 2000)
    } catch (err) {
      setMsg('Gagal simpan profil: ' + (err.message || err))
    }
  }

  async function saveItem(e) {
    e.preventDefault()
    if (!String(itemForm.description).trim()) { setMsg('Description diperlukan.'); return }
    try {
      await api.saveSavedItem(editingItemId ? { ...itemForm, id: editingItemId } : itemForm)
      setItemForm(EMPTY_ITEM)
      setEditingItemId(null)
      loadItems()
    } catch (err) {
      setMsg('Gagal simpan item: ' + (err.message || err))
    }
  }

  return (
    <div className="page">
      {msg && <div className="alert">{msg}</div>}

      <div className="section-h">Company Profile (From)</div>
      <div className="card">
        <form onSubmit={saveProfile}>
          <div className="row col">
            <div className="stack">
              <input placeholder="Nama syarikat *" value={profile.name || ''} onChange={(e) => setP('name', e.target.value)} />
              <textarea placeholder="Address" value={profile.address || ''} onChange={(e) => setP('address', e.target.value)} />
              <div className="two-col">
                <input placeholder="Phone" value={profile.phone || ''} onChange={(e) => setP('phone', e.target.value)} />
                <input placeholder="Email" value={profile.email || ''} onChange={(e) => setP('email', e.target.value)} />
              </div>
              <input placeholder="Logo URL (pautan imej)" value={profile.logo_url || ''} onChange={(e) => setP('logo_url', e.target.value)} />
              <input placeholder="Signature URL (pautan imej)" value={profile.signature_url || ''} onChange={(e) => setP('signature_url', e.target.value)} />
              <label style={{ fontSize: 13, color: 'var(--muted)' }}>
                Default Tax %
                <input
                  type="number" step="0.01" value={profile.default_tax_rate ?? 0}
                  onChange={(e) => setP('default_tax_rate', e.target.value)}
                  style={{ marginLeft: 8, width: 90, border: '1px solid var(--line)', borderRadius: 8, padding: '6px 8px' }}
                />
              </label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button className="btn gold" type="submit">Save Profile</button>
                {savedOk && <span style={{ color: 'var(--ok)', fontSize: 13 }}>✓ Disimpan</span>}
              </div>
            </div>
          </div>
        </form>
      </div>

      <div className="section-h">Saved Items (katalog produk)</div>
      <div className="card">
        <form onSubmit={saveItem}>
          <div className="row col">
            <div className="stack">
              <input placeholder="Description *" value={itemForm.description}
                onChange={(e) => setItemForm((f) => ({ ...f, description: e.target.value }))} />
              <div className="two-col">
                <input placeholder="Unit (cth: unit / jam / pcs)" value={itemForm.unit}
                  onChange={(e) => setItemForm((f) => ({ ...f, unit: e.target.value }))} />
                <input type="number" step="0.01" placeholder="Unit price" value={itemForm.unit_price}
                  onChange={(e) => setItemForm((f) => ({ ...f, unit_price: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn primary" type="submit">{editingItemId ? 'Update Item' : 'Tambah Item'}</button>
                {editingItemId && (
                  <button className="btn" type="button" onClick={() => { setEditingItemId(null); setItemForm(EMPTY_ITEM) }}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>

      {items.map((it) => (
        <div className="card" key={it.id}>
          <div className="row" style={{ cursor: 'default' }}>
            <span style={{ fontWeight: 400 }}>{it.description}</span>
            <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="row-value">{fmtMoney(it.unit_price)}{it.unit ? ` / ${it.unit}` : ''}</span>
              <button
                className="btn small"
                onClick={() => {
                  setEditingItemId(it.id)
                  setItemForm({ description: it.description, unit: it.unit || '', unit_price: it.unit_price })
                }}
              >
                ✏️
              </button>
              <button
                className="btn small danger"
                onClick={async () => {
                  if (confirm(`Delete "${it.description}"?`)) {
                    await api.deleteSavedItem(it.id)
                    loadItems()
                  }
                }}
              >
                🗑
              </button>
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
