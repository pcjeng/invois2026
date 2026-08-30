import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import * as api from '../lib/db'
import { typeOf } from '../lib/docTypes'
import { fmtMoney, fmtDate } from '../lib/format'

// Paparan cetak A4 — "Print / Save PDF" akan buka dialog cetak pelayar.
export default function PrintView() {
  const { id } = useParams()
  const [doc, setDoc] = useState(null)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    api.getDocument(id).then(setDoc).catch(() => {})
    api.getProfile().then(setProfile).catch(() => {})
  }, [id])

  if (!doc) {
    return <div className="page"><p style={{ color: 'var(--muted)' }}>Loading…</p></div>
  }

  const type = typeOf(doc.doc_type)
  const totals = api.computeTotals(doc.items || [], doc.discount, doc.tax_rate)

  return (
    <div>
      <div className="print-toolbar no-print">
        <Link to={`/doc/${doc.id}`}>← Kembali ke editor</Link>
        <button className="btn primary" onClick={() => window.print()}>🖨 Print / Save PDF</button>
      </div>

      <div className="print-wrap">
        <div className="sheet">
          <header>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              {profile?.logo_url && <img className="logo" src={profile.logo_url} alt="logo" />}
              <div>
                <h2>{profile?.name || '\u00A0'}</h2>
                <p>{profile?.address || ''}</p>
                <p>{[profile?.phone, profile?.email].filter(Boolean).join(' · ')}</p>
              </div>
            </div>
            <div className="doc-head">
              <h1>{type.title}</h1>
              <p><strong>No: {type.prefix}-{doc.doc_number ?? '—'}</strong></p>
              <p>Date: {fmtDate(doc.issue_date)}</p>
              {!type.isReceipt && doc.due_date ? <p>Due: {fmtDate(doc.due_date)}</p> : null}
            </div>
          </header>

          <section className="billto">
            <h3>{type.isReceipt ? 'Received From' : 'Bill To'}</h3>
            <p><strong>{doc.customer_name}</strong></p>
            {doc.customer_address && <p>{doc.customer_address}</p>}
            {doc.customer_phone && <p>{doc.customer_phone}</p>}
            {doc.customer_email && <p>{doc.customer_email}</p>}
          </section>

          {type.isReceipt && (
            <p className="received-line">
              Received from <strong>{doc.customer_name}</strong> the amount of{' '}
              <strong>{fmtMoney(totals.total)}</strong>
              {doc.payment_method ? ` via ${doc.payment_method}` : ''}.
            </p>
          )}

          <table className="items-table">
            <thead>
              <tr>
                <th style={{ width: 30 }}>#</th>
                <th>Description</th>
                <th className="r">Qty</th>
                <th>Unit</th>
                <th className="r">Unit Price</th>
                <th className="r">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(doc.items || []).map((it, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{it.description}</td>
                  <td className="r">{it.quantity}</td>
                  <td>{it.unit || ''}</td>
                  <td className="r">{fmtMoney(it.unit_price)}</td>
                  <td className="r">
                    {fmtMoney(it.amount ?? (Number(it.quantity) || 0) * (Number(it.unit_price) || 0))}
                  </td>
                </tr>
              ))}
              {(doc.items || []).length === 0 && (
                <tr><td colSpan={6} style={{ color: '#999' }}>Tiada item.</td></tr>
              )}
            </tbody>
          </table>

          <div className="totals-block">
            <div><span>Subtotal</span><span>{fmtMoney(totals.subtotal)}</span></div>
            {Number(doc.discount) > 0 && (
              <div><span>Discount</span><span>-{fmtMoney(doc.discount)}</span></div>
            )}
            {Number(doc.tax_rate) > 0 && (
              <div><span>Tax ({doc.tax_rate}%)</span><span>{fmtMoney(totals.tax)}</span></div>
            )}
            <div className="grand"><span>TOTAL</span><span>{fmtMoney(totals.total)}</span></div>
          </div>

          {doc.notes && (
            <section style={{ marginTop: 18 }}>
              <h3>Notes</h3>
              <p style={{ fontSize: 13 }}>{doc.notes}</p>
            </section>
          )}

          <div className="signature-row">
            {profile?.signature_url && <img className="sig" src={profile.signature_url} alt="signature" />}
            <div>
              _____________________<br />
              {profile?.name || 'Authorised Signature'}
            </div>
          </div>

          <footer>Thank you for your business!</footer>
        </div>
      </div>
    </div>
  )
}
