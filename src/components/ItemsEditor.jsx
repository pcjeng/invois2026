import { useState } from 'react'
import { fmtMoney } from '../lib/format'
import * as api from '../lib/db'

// Editor baris item borang invoice/quote.
// Aliran utama (ikut rujukan): butang "🛒 Add Product" buka sheet PEMILIH PRODUK —
// senarai produk tersimpan (boleh cari), ketuk untuk tambah terus ke baris item.
// "⊕ create new item" dalam sheet membolehkan produk baru dicipta tanpa keluar.
export default function ItemsEditor({ items, onChange }) {
  const [picker, setPicker] = useState(false)
  const [saved, setSaved] = useState([])
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [newForm, setNewForm] = useState({ name: '', price: '', unit: '' })
  const [msg, setMsg] = useState('')

  function set(i, k, v) {
    onChange(items.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)))
  }
  function add() {
    onChange([...items, { description: '', quantity: 1, unit: '', unit_price: 0 }])
  }
  function remove(i) {
    onChange(items.filter((_, idx) => idx !== i))
  }

  async function openPicker() {
    try {
      setSaved(await api.listSavedItems())
    } catch {
      setSaved([])
    }
    setSearch('')
    setCreating(false)
    setMsg('')
    setPicker(true)
  }

  function addProductRow(si) {
    onChange([
      ...items,
      {
        description: si.description,
        quantity: 1,
        unit: si.unit || '',
        unit_price: Number(si.unit_price) || 0,
      },
    ])
    setMsg('✓ ' + si.description + ' ditambah ke dokumen')
  }

  async function createItem(e) {
    e.preventDefault()
    if (!String(newForm.name).trim()) { setMsg('Name produk diperlukan.'); return }
    try {
      const created = await api.saveSavedItem({
        description: String(newForm.name).trim(),
        unit: String(newForm.unit).trim(),
        unit_price: Number(newForm.price) || 0,
      })
      onChange([
        ...items,
        {
          description: created.description,
          quantity: 1,
          unit: created.unit || '',
          unit_price: Number(created.unit_price) || 0,
        },
      ])
      setSaved(await api.listSavedItems())
      setCreating(false)
      setNewForm({ name: '', price: '', unit: '' })
      setMsg('✓ Produk baru dicipta & ditambah')
    } catch (ex) {
      setMsg('Gagal: ' + (ex?.message || ex))
    }
  }

  const filtered = saved.filter(
    (s) =>
      !search.trim() ||
      String(s.description).toLowerCase().includes(search.trim().toLowerCase())
  )

  return (
    <div>
      {items.map((it, i) => (
        <div className="item-box" key={i}>
          <div className="line1">
            <input
              placeholder="Description"
              value={it.description || ''}
              onChange={(e) => set(i, 'description', e.target.value)}
            />
            <button className="del" onClick={() => remove(i)} title="Remove item">✕</button>
          </div>
          <div className="line2">
            <input className="q" type="number" step="any" min="0" placeholder="Qty"
              value={it.quantity ?? ''} onChange={(e) => set(i, 'quantity', e.target.value)} />
            <input className="u" placeholder="unit" value={it.unit || ''}
              onChange={(e) => set(i, 'unit', e.target.value)} />
            <input className="p" type="number" step="0.01" min="0" placeholder="Harga"
              value={it.unit_price ?? ''} onChange={(e) => set(i, 'unit_price', e.target.value)} />
            <span className="amt">
              {fmtMoney((Number(it.quantity) || 0) * (Number(it.unit_price) || 0))}
            </span>
          </div>
        </div>
      ))}
      <div className="items-footer">
        <button className="btn" onClick={add}>＋ Add Row</button>
        <button className="btn gold" onClick={openPicker}>🛒 Add Product</button>
      </div>

      {picker && (
        <div className="add-overlay" onClick={() => setPicker(false)}>
          <div className="pick-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="add-head">
              Pilih Produk
              <button onClick={() => setPicker(false)} aria-label="tutup">✕</button>
            </div>
            {msg && <div className="pick-msg">{msg}</div>}
            {!creating && (
              <>
                <input
                  className="pick-search"
                  placeholder="Cari produk…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="pick-list">
                  {filtered.length === 0 && (
                    <p className="pick-empty">
                      Tiada produk. Tekan "⊕ create new item" di bawah untuk tambah.
                    </p>
                  )}
                  {filtered.map((si) => (
                    <button key={si.id} className="pick-row" onClick={() => addProductRow(si)}>
                      <span className="pick-name">
                        {si.description}{si.unit ? ` (${si.unit})` : ''}
                      </span>
                      <span className="pick-price">{fmtMoney(si.unit_price)}</span>
                    </button>
                  ))}
                </div>
                <button className="pick-create" onClick={() => setCreating(true)}>
                  ⊕ create new item
                </button>
              </>
            )}
            {creating && (
              <form className="pick-form" onSubmit={createItem}>
                <input
                  placeholder="Name produk *"
                  value={newForm.name}
                  onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))}
                  autoFocus
                />
                <div className="two-col">
                  <input
                    type="number" step="0.01" min="0" placeholder="Price (RM)"
                    value={newForm.price}
                    onChange={(e) => setNewForm((f) => ({ ...f, price: e.target.value }))}
                  />
                  <input
                    placeholder="Unit (pcs / unit / jam)"
                    value={newForm.unit}
                    onChange={(e) => setNewForm((f) => ({ ...f, unit: e.target.value }))}
                  />
                </div>
                <div className="pick-form-actions">
                  <button className="btn gold" type="submit">Simpan &amp; Tambah</button>
                  <button className="btn" type="button" onClick={() => setCreating(false)}>Batal</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
