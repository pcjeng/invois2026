import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import * as api from '../lib/db'
import { typeOf, statusOptionsFor, PAYMENT_METHODS } from '../lib/docTypes'
import { fmtMoney, fmtDate, todayISO } from '../lib/format'
import DocTypePicker from '../components/DocTypePicker'
import ItemsEditor from '../components/ItemsEditor'

// Editor dokumen — ikut susunan skrin "New Quote" aplikasi rujukan:
// Switch Document → no. dokumen → tarikh → From → Bill To → Items → Totals → Status/Notes.
export default function Editor() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const initialType = searchParams.get('type') || 'quote'
  const navigate = useNavigate()
  const [doc, setDoc] = useState(() => api.emptyDocument(initialType))
  const [profile, setProfile] = useState(null)
  const [customers, setCustomers] = useState([])
  const [showTypePicker, setShowTypePicker] = useState(false)
  const [showItems, setShowItems] = useState(true)
  const [numberTouched, setNumberTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [payments, setPayments] = useState([])
  const [payForm, setPayForm] = useState({ pay_date: todayISO(), method: 'Bank Transfer', amount: '' })

  useEffect(() => {
    api.getProfile().then((p) => {
      setProfile(p)
      // dokumen baru: guna default tax rate dari settings
      if (!id) setDoc((d) => ({ ...d, tax_rate: Number(p?.default_tax_rate) || 0 }))
    }).catch(() => {})
    api.listCustomers().then(setCustomers).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (id) {
      api.getDocument(id)
        .then((d) => {
          setDoc({ ...api.emptyDocument(d.doc_type), ...d })
          setNumberTouched(true)
          if (['invoice', 'tax_invoice', 'proforma'].includes(d.doc_type)) {
            api.listPayments(d.id).then(setPayments).catch(() => {})
          }
        })
        .catch(() => setError('Dokumen tidak dijumpai.'))
    } else {
      api.nextDocNumber(initialType, '')
        .then((n) => setDoc((d) => (d.doc_number ? d : { ...d, doc_number: String(n) })))
        .catch(() => {})
    }
  }, [id])

  const type = typeOf(doc.doc_type)
  const totals = useMemo(
    () => api.computeTotals(doc.items || [], doc.discount, doc.tax_rate),
    [doc.items, doc.discount, doc.tax_rate]
  )
  const showPayment = type.isReceipt || String(doc.doc_type).includes('invoice')

  function setField(k, v) {
    setDoc((d) => ({ ...d, [k]: v }))
  }

  async function pickType(typeId) {
    setShowTypePicker(false)
    setDoc((d) => ({ ...d, doc_type: typeId, status: statusOptionsFor(typeId)[0] }))
    if (!id && !numberTouched) {
      try {
        const n = await api.nextDocNumber(typeId, doc.issue_date)
        setDoc((d) => (d.doc_type === typeId ? { ...d, doc_number: String(n) } : d))
      } catch { /* abaikan */ }
    }
  }

  // Nombor ikut tarikh dokumen (format YYYYMMDD + turutan) selagi tak diubah manual
  async function changeIssueDate(v) {
    setField('issue_date', v)
    if (!id && !numberTouched && v) {
      try {
        const n = await api.nextDocNumber(doc.doc_type, v)
        setDoc((d) => (numberTouched ? d : { ...d, doc_number: String(n) }))
      } catch { /* abaikan */ }
    }
  }

  function pickCustomer(v) {
    if (v === '__custom') {
      setDoc((d) => ({ ...d, customer_id: null }))
    } else {
      const c = customers.find((x) => x.id === v)
      if (c) {
        setDoc((d) => ({
          ...d,
          customer_id: c.id,
          customer_name: c.name || '',
          customer_address: c.address || '',
          customer_phone: c.phone || '',
          customer_email: c.email || '',
        }))
      }
    }
  }

  // ---------- Bayaran (payments) untuk invois ----------
  async function addPay(e) {
    e.preventDefault()
    if (!Number(payForm.amount)) { setError('Masukkan jumlah bayaran.'); return }
    try {
      const p = await api.addPayment({
        document_id: id,
        pay_date: payForm.pay_date,
        method: payForm.method,
        amount: payForm.amount,
      })
      setPayments((ps) => [...ps, p])
      setPayForm((f) => ({ ...f, amount: '' }))
    } catch (ex) {
      setError('Gagal tambah bayaran: ' + (ex?.message || ex))
    }
  }

  async function delPay(pid) {
    try {
      await api.deletePayment(pid)
      setPayments((ps) => ps.filter((x) => x.id !== pid))
    } catch (ex) {
      setError('Gagal padam bayaran: ' + (ex?.message || ex))
    }
  }

  async function onSave() {
    if (!String(doc.customer_name || '').trim()) {
      setError('Bill To / nama customer diperlukan.')
      return
    }
    setSaving(true)
    setError('')
    try {
      let number = Number(doc.doc_number)
      if (!number) number = await api.nextDocNumber(doc.doc_type)
      await api.saveDocument({ ...doc, doc_number: number })
      navigate('/')
    } catch (e) {
      setError('Gagal simpan: ' + (e?.message || e))
      setSaving(false)
    }
  }

  return (
    <div className="page">
      {error && <div className="alert">{error}</div>}

      <div className="card">
        <button className="row" onClick={() => setShowTypePicker(true)}>
          <span>Switch Document</span>
          <span className="row-value">{type.label} ›</span>
        </button>
        <label className="row">
          <span>{type.label} #</span>
          <input
            style={{ width: 120, textAlign: 'right' }}
            value={doc.doc_number ?? ''}
            onChange={(e) => { setNumberTouched(true); setField('doc_number', e.target.value) }}
          />
        </label>
        <label className="row">
          <span>Issue Date</span>
          <input type="date" value={doc.issue_date || ''} onChange={(e) => changeIssueDate(e.target.value)} />
        </label>
        {!type.isReceipt && (
          <label className="row">
            <span>Due Date</span>
            <input type="date" value={doc.due_date || ''} onChange={(e) => setField('due_date', e.target.value)} />
          </label>
        )}
      </div>

      <div className="card">
        <Link className="row" to="/settings">
          <span>From</span>
          <span className="row-value">{profile?.name ? profile.name + ' ›' : 'Set in Settings ›'}</span>
        </Link>
        <div className="row col">
          <span>Bill To</span>
          <select value={doc.customer_id || '__custom'} onChange={(e) => pickCustomer(e.target.value)}>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
            <option value="__custom">— Custom / Baru —</option>
          </select>
          <div className="stack">
            <input placeholder="Nama *" value={doc.customer_name || ''}
              onChange={(e) => setField('customer_name', e.target.value)} />
            <input placeholder="Address" value={doc.customer_address || ''}
              onChange={(e) => setField('customer_address', e.target.value)} />
            <div className="two-col">
              <input placeholder="Phone" value={doc.customer_phone || ''}
                onChange={(e) => setField('customer_phone', e.target.value)} />
              <input placeholder="Email" value={doc.customer_email || ''}
                onChange={(e) => setField('customer_email', e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <button className="row" onClick={() => setShowItems((s) => !s)}>
          <span>Add or Edit Items</span>
          <span className="row-value">{fmtMoney(totals.subtotal)} {showItems ? '⌄' : '›'}</span>
        </button>
        {showItems && <ItemsEditor items={doc.items || []} onChange={(items) => setField('items', items)} />}
      </div>

      <div className="card totals">
        <div className="t-row"><span>Subtotal</span><span>{fmtMoney(totals.subtotal)}</span></div>
        <div className="t-row">
          <span>Discount (RM)</span>
          <input type="number" step="0.01" value={doc.discount ?? 0} onChange={(e) => setField('discount', e.target.value)} />
        </div>
        <div className="t-row">
          <span>Tax %</span>
          <input type="number" step="0.01" value={doc.tax_rate ?? 0} onChange={(e) => setField('tax_rate', e.target.value)} />
        </div>
        <div className="t-row"><span>Tax Amount</span><span>{fmtMoney(totals.tax)}</span></div>
        <div className="t-row grand"><span>TOTAL</span><span>{fmtMoney(totals.total)}</span></div>
      </div>

      {/invoice|tax_invoice|proforma/.test(doc.doc_type) && (
        <div className="card">
          <div className="row col">
            <span>Payments (Bayaran)</span>
            <div className="stack">
              {!id && (
                <p className="upload-hint" style={{ margin: 0 }}>
                  Simpan dokumen dahulu untuk merekod bayaran.
                </p>
              )}
              {id && (
                <>
                  {payments.map((p) => (
                    <div className="pay-line" key={p.id}>
                      <span>{fmtDate(p.pay_date)} · {p.method || '—'}</span>
                      <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <b>{fmtMoney(p.amount)}</b>
                        <button className="btn small danger" onClick={() => delPay(p.id)} title="Padam">✕</button>
                      </span>
                    </div>
                  ))}
                  {payments.length === 0 && (
                    <p className="upload-hint" style={{ margin: 0 }}>Tiada bayaran direkod lagi.</p>
                  )}
                  <form onSubmit={addPay} className="stack">
                    <div className="two-col">
                      <input type="date" value={payForm.pay_date} onChange={(e) => setPayForm((f) => ({ ...f, pay_date: e.target.value }))} />
                      <select value={payForm.method} onChange={(e) => setPayForm((f) => ({ ...f, method: e.target.value }))}>
                        {PAYMENT_METHODS.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="number" step="0.01" min="0" placeholder="Jumlah bayaran (RM)"
                        value={payForm.amount}
                        onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))}
                        style={{ flex: 1 }}
                      />
                      <button className="btn primary" type="submit">＋ Tambah</button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <label className="row">
          <span>Status</span>
          <select style={{ width: 160 }} value={doc.status || 'Draft'} onChange={(e) => setField('status', e.target.value)}>
            {statusOptionsFor(doc.doc_type).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        {showPayment && (
          <label className="row">
            <span>Payment Method</span>
            <select style={{ width: 180 }} value={doc.payment_method || ''} onChange={(e) => setField('payment_method', e.target.value)}>
              <option value="">—</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
        )}
        <label className="row col">
          <span>Notes</span>
          <textarea
            value={doc.notes || ''}
            onChange={(e) => setField('notes', e.target.value)}
            placeholder="Terma bayaran, no. akaun bank, ucapan terima kasih…"
          />
        </label>
      </div>

      <button className="fab" onClick={onSave} disabled={saving}>✓ Save {type.label}</button>

      {showTypePicker && (
        <DocTypePicker current={doc.doc_type} onPick={pickType} onClose={() => setShowTypePicker(false)} />
      )}
    </div>
  )
}
