import { useEffect, useRef, useState } from 'react'
import * as api from '../lib/db'
import { uploadImage, isConfigured as cloudinaryReady } from '../lib/cloudinary'
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
  const [accountEmail, setAccountEmail] = useState('')
  const [uploading, setUploading] = useState(null) // 'logo_url' | 'signature_url' | null
  const [uploadMsg, setUploadMsg] = useState('')
  const [pwForm, setPwForm] = useState({ a: '', b: '' })
  const [pwMsg, setPwMsg] = useState('')
  const logoFileRef = useRef(null)
  const sigFileRef = useRef(null)
  const stampFileRef = useRef(null)

  useEffect(() => {
    api.getProfile().then((p) => { if (p) setProfile({ ...EMPTY_PROFILE, ...p }) }).catch(() => {})
    loadItems()
    api.getSession().then((s) => setAccountEmail(s?.user?.email || '')).catch(() => {})
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

  async function handleUpload(kind, e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(kind)
    setUploadMsg('')
    try {
      const res = await uploadImage(file)
      setP(kind, res.secure_url)
      setUploadMsg('✓ ' + (kind === 'logo_url' ? 'Logo' : 'Signature') + ' di-upload ke Cloudinary — klik Save Profile')
    } catch (ex) {
      setUploadMsg('Upload gagal: ' + (ex?.message || ex))
    }
    setUploading(null)
    // benar pilih fail yang sama semula
    if (kind === 'logo_url' && logoFileRef.current) logoFileRef.current.value = ''
    if (kind === 'signature_url' && sigFileRef.current) sigFileRef.current.value = ''
    if (kind === 'stamp_url' && stampFileRef.current) stampFileRef.current.value = ''
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

  async function changePw(e) {
    e.preventDefault()
    setPwMsg('')
    if (pwForm.a.length < 6) { setPwMsg('Kata laluan sekurang-kurangnya 6 aksara.'); return }
    if (pwForm.a !== pwForm.b) { setPwMsg('Kata laluan tidak sama.'); return }
    try {
      await api.updatePassword(pwForm.a)
      setPwMsg('✓ Kata laluan berjaya ditukar.')
      setPwForm({ a: '', b: '' })
    } catch (ex) {
      setPwMsg('Gagal: ' + (ex?.message || ex))
    }
  }

  return (
    <div className="page">
      {msg && <div className="alert">{msg}</div>}
      {accountEmail && (
        <div className="section-h">Akaun: {accountEmail}</div>
      )}

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

              <label style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>Logo syarikat</label>
              <div className="upload-row">
                <input
                  ref={logoFileRef}
                  type="file"
                  accept="image/*"
                  className="file-btn"
                  onChange={(e) => handleUpload('logo_url', e)}
                  disabled={!cloudinaryReady || uploading === 'logo_url'}
                />
                {profile.logo_url && <img src={profile.logo_url} alt="logo" style={{ maxHeight: 40, maxWidth: 90, objectFit: 'contain' }} />}
              </div>
              <input placeholder="…atau tampal Logo URL" value={profile.logo_url || ''} onChange={(e) => setP('logo_url', e.target.value)} />

              <label style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>Signature</label>
              <div className="upload-row">
                <input
                  ref={sigFileRef}
                  type="file"
                  accept="image/*"
                  className="file-btn"
                  onChange={(e) => handleUpload('signature_url', e)}
                  disabled={!cloudinaryReady || uploading === 'signature_url'}
                />
                {profile.signature_url && <img src={profile.signature_url} alt="signature" style={{ maxHeight: 40, maxWidth: 120, objectFit: 'contain' }} />}
              </div>
              <input placeholder="…atau tampal Signature URL" value={profile.signature_url || ''} onChange={(e) => setP('signature_url', e.target.value)} />

              <label style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>Cop Syarikat (Company Seal)</label>
              <div className="upload-row">
                <input
                  ref={stampFileRef}
                  type="file"
                  accept="image/*"
                  className="file-btn"
                  onChange={(e) => handleUpload('stamp_url', e)}
                  disabled={!cloudinaryReady || uploading === 'stamp_url'}
                />
                {profile.stamp_url && <img src={profile.stamp_url} alt="cop" style={{ maxHeight: 40, maxWidth: 90, objectFit: 'contain' }} />}
              </div>
              <input placeholder="…atau tampal Cop URL" value={profile.stamp_url || ''} onChange={(e) => setP('stamp_url', e.target.value)} />
              {uploadMsg && <span className={uploadMsg.startsWith('✓') ? 'upload-ok' : 'alert'} style={{ display: 'inline-block' }}>{uploadMsg}</span>}
              {!cloudinaryReady && (
                <span className="upload-hint">
                  Cloudinary belum dikonfigur — upload dimitikan. Boleh tampal URL imej terus, atau konfigur VITE_CLOUDINARY_* dalam .env (lihat README).
                </span>
              )}
              {uploading && <span className="upload-hint">Sedang mengupload…</span>}

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

      <div className="section-h">Tukar Kata Laluan</div>
      <div className="card">
        <form onSubmit={changePw}>
          <div className="row col">
            <div className="stack">
              <input type="password" placeholder="Kata laluan baharu" autoComplete="new-password"
                value={pwForm.a} onChange={(e) => setPwForm((f) => ({ ...f, a: e.target.value }))} />
              <input type="password" placeholder="Sahkan kata laluan baharu" autoComplete="new-password"
                value={pwForm.b} onChange={(e) => setPwForm((f) => ({ ...f, b: e.target.value }))} />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button className="btn primary" type="submit">Tukar Kata Laluan</button>
                {pwMsg && <span style={{ fontSize: 12, color: pwMsg.startsWith('✓') ? 'var(--ok)' : 'var(--danger)' }}>{pwMsg}</span>}
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
