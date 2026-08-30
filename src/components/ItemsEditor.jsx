import { useState } from 'react'
import { fmtMoney } from '../lib/format'
import * as api from '../lib/db'

// Editor baris item: description, qty, unit, unit price — amount auto.
// "Saved Items" menarik item dari katalog (Settings) untuk tambah pantas.
export default function ItemsEditor({ items, onChange }) {
  const [picker, setPicker] = useState(false)
  const [saved, setSaved] = useState([])

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
    setPicker(true)
  }

  function pickSaved(si) {
    onChange([
      ...items,
      {
        description: si.description,
        quantity: 1,
        unit: si.unit || '',
        unit_price: Number(si.unit_price) || 0,
      },
    ])
    setPicker(false)
  }

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
        <button className="btn" onClick={openPicker}>★ Saved Items</button>
      </div>

      {picker && (
        <div className="modal-overlay" onClick={() => setPicker(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              Saved Items
              <button onClick={() => setPicker(false)} aria-label="tutup">✕</button>
            </div>
            {saved.length === 0 && (
              <p style={{ padding: 16, color: '#757575' }}>
                Tiada saved items lagi. Tambah dalam page Settings.
              </p>
            )}
            {saved.map((si) => (
              <button key={si.id} className="picker-item" onClick={() => pickSaved(si)}>
                <span>{si.description}</span>
                <span className="check">{fmtMoney(si.unit_price)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
