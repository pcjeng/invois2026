import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../lib/db'
import { DOC_TYPES, typeOf } from '../lib/docTypes'
import { fmtMoney, fmtDate, todayISO } from '../lib/format'

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

  const q = search.trim().toLowerCase()
  const visible = docs.filter(
    (d) =>
      (filter === 'all' || d.doc_type === filter) &&
      (!q ||
        String(d.customer_name || '').toLowerCase().includes(q) ||
        String(d.doc_number || '').includes(q))
  )

  async function duplicate(d) {
    try {
      const full = await api.getDocument(d.id)
      const n = await api.nextDocNumber(d.doc_type)
      await api.saveDocument({
        ...full,
        id: null,
        doc_number: n,
        status: 'Draft',
        issue_date: todayISO(),
        due_date: '',
        archived: false,
      })
      load()
    } catch (e) {
      alert('Gagal duplicate: ' + (e.message || e))
    }
  }

  return (
    <div className="page">
      <input
        className="search-input"
        placeholder="Cari customer / no. dokumen…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="chips">
        <button className={'chip' + (filter === 'all' ? ' active' : '')} onClick={() => setFilter('all')}>
          All
        </button>
        {DOC_TYPES.map((t) => (
          <button
            key={t.id}
            className={'chip' + (filter === t.id ? ' active' : '')}
            onClick={() => setFilter(t.id)}
          >
            {t.label}
          </button>
        ))}
        <button className={'chip' + (showArchived ? ' active' : '')} onClick={() => setShowArchived((s) => !s)}>
          Archived
        </button>
      </div>

      {loading && <p style={{ color: 'var(--muted)' }}>Loading…</p>}

      {!loading && visible.length === 0 && (
        <div className="card" style={{ padding: 28, textAlign: 'center', color: 'var(--muted)' }}>
          <p>Tiada dokumen lagi.</p>
          <button className="btn gold" onClick={() => navigate('/new')}>＋ New Document</button>
        </div>
      )}

      {visible.map((d) => {
        const t = typeOf(d.doc_type)
        return (
          <div className="card" key={d.id} style={{ padding: '12px 16px 12px' }}>
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

      <button className="fab" onClick={() => navigate('/new')}>＋ New</button>
    </div>
  )
}
