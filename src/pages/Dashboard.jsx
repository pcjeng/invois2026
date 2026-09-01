import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../lib/db'
import { DOC_TYPES, typeOf } from '../lib/docTypes'
import { fmtMoney, fmtDate, todayISO } from '../lib/format'

const INV = ['invoice', 'tax_invoice', 'proforma']
const RCP = ['receipt', 'sales_receipt', 'cash_receipt']
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const YEAR_NOW = new Date().getFullYear()
const YEARS = Array.from({ length: YEAR_NOW - 2019 + 1 }, (_, i) => YEAR_NOW - i)

// Menu "Mula Baharu" — keluar bila FAB biru diklik (ikut photo rujukan)
const ADD_TILES = [
  { label: 'New Invoice', code: 'INV', color: '#1E88E5', go: (n) => n('/new?type=invoice') },
  { label: 'New Tax Invoice', code: 'TINV', color: '#3F51B5', go: (n) => n('/new?type=tax_invoice') },
  { label: 'New Receipt', code: 'RCP', color: '#26A69A', go: (n) => n('/new?type=receipt') },
  { label: 'New EQ', code: 'E/Q', color: '#F9A825', go: (n) => n('/new?type=quote') },
  { label: 'New Purchase Order', code: 'PO', color: '#26C6DA', go: (n) => n('/new?type=purchase_order') },
  { label: 'New Delivery Note', code: 'DN', color: '#9CCC65', go: (n) => n('/new?type=delivery_note') },
  { label: 'New Client/Vendor', code: 'C/V', color: '#EC407A', go: (n) => n('/customers') },
  { label: 'New Product', code: 'PRD', color: '#8D6E63', go: (n) => n('/settings') },
  { label: 'New Company', code: 'CO', color: '#5C6BC0', go: (n) => n('/settings') },
  { label: 'New User', code: 'USR', color: '#7E57C2', adminOnly: true, go: (n) => n('/admin') },
  { label: 'New Bill/Purchase', code: 'B/P', color: '#95A5A6', disabled: true },
  { label: 'New Expense', code: 'EXP', color: '#95A5A6', disabled: true },
  { label: 'New Tax', code: 'TAX', color: '#95A5A6', disabled: true },
]

function sumOf(docs, types) {
  return docs.filter((d) => types.includes(d.doc_type)).reduce((s, d) => s + Number(d.total || 0), 0)
}
function countOf(docs, types) {
  return docs.filter((d) => types.includes(d.doc_type)).length
}
function fmt2(n) {
  return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function statusClass(s) {
  if (['Paid', 'Accepted', 'Completed'].includes(s)) return 's-positive'
  if (['Overdue', 'Rejected'].includes(s)) return 's-negative'
  if (s === 'Sent') return 's-sent'
  return ''
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [year, setYear] = useState(YEAR_NOW)
  const [showAdd, setShowAdd] = useState(false)
  const [customers, setCustomers] = useState([])
  const [savedItems, setSavedItems] = useState([])
  const [hasCompany, setHasCompany] = useState(false)
  const [role, setRole] = useState('user')
  const [platformUsers, setPlatformUsers] = useState(0)

  async function load() {
    setLoading(true)
    try {
      setDocs(await api.listDocuments({ includeArchived: showArchived }))
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }
  useEffect(() => { load() }, [showArchived])

  useEffect(() => {
    api.listCustomers().then(setCustomers).catch(() => setCustomers([]))
    api.listSavedItems().then(setSavedItems).catch(() => setSavedItems([]))
    api.getProfile().then((p) => setHasCompany(Boolean(p && p.name))).catch(() => {})
    api.getMyRole().then(setRole).catch(() => {})
  }, [])

  useEffect(() => {
    api.getMyRole().then((r) => {
      setRole(r)
      if (r === 'admin') {
        api.adminListUsers().then((u) => setPlatformUsers((u || []).length)).catch(() => {})
      }
    }).catch(() => {})
  }, [])

  const yDocs = useMemo(
    () => docs.filter((d) => String(d.issue_date || '').slice(0, 4) === String(year)),
    [docs, year]
  )
  const overdue = useMemo(
    () =>
      yDocs.filter(
        (d) =>
          INV.includes(d.doc_type) &&
          (d.status === 'Overdue' || (d.status === 'Sent' && d.due_date && d.due_date < todayISO()))
      ),
    [yDocs]
  )

  // 14 kad ALL DATA — ikut paparan rujukan
  const cards = [
    { label: 'Invoice', icon: '📄', color: '#1E88E5', types: INV, amount: true },
    { label: 'Invoice Payment', icon: '💰', color: '#43A047', types: RCP, amount: true },
    { label: 'Due Invoice', icon: '⏰', color: '#EF5350', types: INV, amount: true, unpaid: true },
    { label: 'Expense', icon: '💸', color: '#95A5A6', static: true, amount: true },
    { label: 'Estimate/Quotation', icon: '📝', color: '#F9A825', types: ['quote', 'estimate'], amount: true },
    { label: 'Purchase Order', icon: '🛍️', color: '#26C6DA', types: ['purchase_order'], amount: true },
    { label: 'Bill/Purchase', icon: '🛒', color: '#95A5A6', static: true, amount: true },
    { label: 'Bill Payment', icon: '🤲', color: '#95A5A6', static: true, amount: true },
    { label: 'Due Bill', icon: '🧾', color: '#95A5A6', static: true, amount: true },
    { label: 'Product', icon: '📦', color: '#8D6E63', savedItems: true },
    { label: 'Company', icon: '🏢', color: '#5C6BC0', company: true },
    { label: 'User', icon: '👤', color: '#7E57C2', users: true },
    { label: 'Client/Vendor', icon: '🧑‍🤝‍🧑', color: '#EC407A', customers: true },
    { label: 'Tax', icon: '🏷️', color: '#EF5350', static: true },
  ]

  function cardData(c) {
    let count = 0
    let value = 0
    if (c.static) { count = 0; value = 0 }
    else if (c.savedItems) count = savedItems.length
    else if (c.company) count = hasCompany ? 1 : 0
    else if (c.users) count = role === 'admin' ? platformUsers : 0
    else if (c.customers) count = customers.length
    else if (c.types) {
      count = countOf(yDocs, c.types)
      value = sumOf(yDocs, c.types)
    }
    if (c.unpaid) {
      const unpaidDocs = yDocs.filter((d) => c.types.includes(d.doc_type) && (d.status === 'Sent' || d.status === 'Overdue'))
      count = unpaidDocs.length
      value = unpaidDocs.reduce((s, d) => s + Number(d.total || 0), 0)
    }
    return { count, value }
  }

  function onCardClick(c) {
    if (c.types) setFilter(c.types[0])
    else if (c.customers) navigate('/customers')
    else if (c.savedItems || c.company) navigate('/settings')
  }

  async function duplicate(d) {
    try {
      const full = await api.getDocument(d.id)
      const n = await api.nextDocNumber(d.doc_type, d.issue_date)
      await api.saveDocument({
        ...full,
        id: null,
        doc_number: n,
        status: 'Draft',
        issue_date: d.issue_date || todayISO(),
        due_date: '',
        archived: false,
      })
      load()
    } catch (e) {
      alert('Gagal duplicate: ' + (e.message || e))
    }
  }

  const q = search.trim().toLowerCase()
  const visible = docs.filter(
    (d) =>
      (filter === 'all' || d.doc_type === filter) &&
      (!q ||
        String(d.customer_name || '').toLowerCase().includes(q) ||
        String(d.doc_number || '').includes(q))
  )

  return (
    <div className="page">
      {/* SECTION: INVOICE & PAYMENT — kad bulanan merah/green, scroll melintang */}
      <div className="dash-section">
        <div className="dash-section-h">
          <span>Invoice &amp; Payment</span>
          <select className="year-select" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="dash-section-body">
          <div className="month-scroll">
            {MONTHS.map((m, mi) => {
              const md = yDocs.filter((d) => Number(String(d.issue_date || '').slice(5, 7)) === mi + 1)
              const inv = fmt2(sumOf(md, INV))
              const pay = fmt2(sumOf(md, RCP))
              return (
                <div className="month-card" key={m}>
                  <div className="m-label">{m}</div>
                  <div className="m-boxes">
                    <div className="m-box red"><small>Inv</small><span>{inv}</span></div>
                    <div className="m-box green"><small>Pay</small><span>{pay}</span></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* SECTION: ALL DATA — 14 kad statistik */}
      <div className="dash-section">
        <div className="dash-section-h">
          <span>All Data</span>
          <select className="year-select" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="dash-section-body">
          <div className="stat-grid">
            {cards.map((c) => {
              const { count, value } = cardData(c)
              const dim = Boolean(c.static)
              return (
                <button
                  key={c.label}
                  className={'stat-card' + (dim ? ' dim' : '')}
                  onClick={() => onCardClick(c)}
                >
                  <span className="ico" style={{ color: c.color }}>{c.icon}</span>
                  <span className="stat-main">
                    <span className="stat-count">{count}</span>
                    {c.amount && <span className="stat-value">RM{fmt2(value)}</span>}
                    <span className="stat-label">{c.label}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* SECTION: OVERDUE INVOICES */}
      <div className="dash-section">
        <div className="dash-section-h">
          <span>Overdue Invoices</span>
          <select className="year-select" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="dash-section-body">
          {overdue.length === 0 && (
            <p style={{ padding: 14, color: 'var(--muted)', margin: 0 }}>Tiada invoice tertunggak untuk {year}.</p>
          )}
          {overdue.map((d) => {
            const t = typeOf(d.doc_type)
            return (
              <div className="overdue-row" key={d.id} onClick={() => navigate(`/doc/${d.id}`)}>
                <div>
                  <div className="overdue-name">{d.customer_name || '(tiada customer)'}</div>
                  <div className="overdue-sub">
                    {t.label} #{d.doc_number} · Due {fmtDate(d.due_date)} · Amount Due :{' '}
                    <b>RM {fmt2(d.total)}</b>
                  </div>
                </div>
                <span className="overdue-ico">💳</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* SECTION: DOKUMEN (senarai penuh — carian & tindakan) */}
      <div className="dash-section">
        <div className="dash-section-h"><span>Dokumen</span></div>
        <div className="dash-section-body" style={{ padding: 12 }}>
          <input
            className="search-input"
            style={{ marginBottom: 10 }}
            placeholder="Cari customer / no. dokumen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="chips">
            <button className={'chip' + (filter === 'all' ? ' active' : '')} onClick={() => setFilter('all')}>All</button>
            {DOC_TYPES.map((t) => (
              <button key={t.id} className={'chip' + (filter === t.id ? ' active' : '')} onClick={() => setFilter(t.id)}>
                {t.label}
              </button>
            ))}
            <button className={'chip' + (showArchived ? ' active' : '')} onClick={() => setShowArchived((s) => !s)}>Archived</button>
          </div>

          {loading && <p style={{ color: 'var(--muted)' }}>Loading…</p>}

          {!loading && visible.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--muted)', padding: 16 }}>Tiada dokumen lagi.</p>
          )}

          {visible.map((d) => {
            const t = typeOf(d.doc_type)
            return (
              <div className="card" key={d.id} style={{ padding: '12px 16px' }}>
                <div className="doc-top">
                  <span className="type-dot" style={{ background: t.color }} />
                  <span className="type-label">{t.label}</span>
                  <span className="doc-number">{t.prefix}-{d.doc_number ?? '—'}</span>
                  <span className={'status-chip ' + statusClass(d.status)}>{d.status}</span>
                </div>
                <div className="doc-customer">{d.customer_name || '(tiada customer)'}</div>
                <div className="doc-meta">
                  <span className="doc-date">{fmtDate(d.issue_date)}{d.archived ? ' · archived' : ''}</span>
                  <span className="doc-total">{fmtMoney(d.total)}</span>
                </div>
                <div className="doc-actions">
                  <button className="btn small" onClick={() => navigate(`/doc/${d.id}`)}>✏️ Edit</button>
                  <button className="btn small" onClick={() => navigate(`/doc/${d.id}/print`)}>🖨 Print</button>
                  {d.pdf_url && (
                    <a className="btn small" href={d.pdf_url} target="_blank" rel="noreferrer">📎 PDF</a>
                  )}
                  <button className="btn small" onClick={() => duplicate(d)}>⧉ Copy</button>
                  <button
                    className="btn small"
                    onClick={async () => { await api.setArchived(d.id, !d.archived); load() }}
                  >
                    {d.archived ? '↥ Unarchive' : '↧ Archive'}
                  </button>
                  <button
                    className="btn small danger"
                    onClick={async () => {
                      if (confirm(`Delete ${t.label} #${d.doc_number}?`)) {
                        await api.deleteDocument(d.id)
                        load()
                      }
                    }}
                  >
                    🗑
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <button className="fab-blue" onClick={() => setShowAdd(true)} title="Tambah baharu">＋</button>

      {showAdd && (
        <div className="add-overlay" onClick={() => setShowAdd(false)}>
          <div className="add-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="add-head">
              <span>Mula Baharu</span>
              <button onClick={() => setShowAdd(false)} aria-label="tutup">✕</button>
            </div>
            <div className="add-grid">
              {ADD_TILES.map((t) => {
                const locked = t.disabled || (t.adminOnly && role !== 'admin')
                return (
                  <button
                    key={t.label}
                    className={'add-tile' + (locked ? ' locked' : '')}
                    title={locked ? (t.disabled ? 'Akan datang' : 'Admin sahaja') : t.label}
                    disabled={locked}
                    onClick={() => { setShowAdd(false); t.go(navigate) }}
                  >
                    <span className="add-ico" style={{ background: t.color }}>{t.code}</span>
                    <span className="add-label">{t.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
