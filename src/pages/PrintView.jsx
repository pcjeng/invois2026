import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import * as api from '../lib/db'
import { uploadPdf, isConfigured as cloudinaryReady } from '../lib/cloudinary'
import { typeOf } from '../lib/docTypes'
import { fmtMoney, fmtDate } from '../lib/format'

// Paparan cetak A4 — "Print / Save PDF" akan buka dialog cetak pelayar.
export default function PrintView() {
  const { id } = useParams()
  const [doc, setDoc] = useState(null)
  const [profile, setProfile] = useState(null)
  const [savingPdf, setSavingPdf] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    api.getDocument(id).then(setDoc).catch(() => {})
    api.getProfile().then(setProfile).catch(() => {})
  }, [id])

  // Jana PDF dari paparan cetak, upload ke Cloudinary, dan simpan pautan pada dokumen.
  async function saveToCloud() {
    if (!cloudinaryReady) {
      setSaveMsg('Cloudinary belum dikonfigur — lihat README (VITE_CLOUDINARY_*).')
      return
    }
    setSavingPdf(true)
    setSaveMsg('Sedang jana PDF…')
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])
      const el = document.querySelector('.sheet')
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' })
      const imgData = canvas.toDataURL('image/jpeg', 0.92)
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
      const pageW = 210
      const pageH = 297
      const imgH = (canvas.height * pageW) / canvas.width
      pdf.addImage(imgData, 'JPEG', 0, 0, pageW, imgH)
      let y = pageH
      while (y < imgH) {
        pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, -y, pageW, imgH)
        y += pageH
      }
      setSaveMsg('Sedang upload ke Cloudinary…')
      const blob = pdf.output('blob')
      const t = typeOf(doc.doc_type)
      const res = await uploadPdf(blob, `${t.title}-${doc.doc_number}.pdf`)
      await api.setPdfUrl(doc.id, res.secure_url)
      setSaveMsg('✓ PDF disimpan ke Cloud')
      setDoc((d) => ({ ...d, pdf_url: res.secure_url }))
    } catch (ex) {
      setSaveMsg('Gagal: ' + (ex?.message || ex))
    }
    setSavingPdf(false)
  }

  if (!doc) {
    return <div className="page"><p style={{ color: 'var(--muted)' }}>Loading…</p></div>
  }

  const type = typeOf(doc.doc_type)
  const totals = api.computeTotals(doc.items || [], doc.discount, doc.tax_rate)

  return (
    <div>
      <div className="print-toolbar no-print">
        <Link to={`/doc/${doc.id}`}>← Kembali ke editor</Link>
        <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {doc.pdf_url && (
            <a className="btn small" href={doc.pdf_url} target="_blank" rel="noreferrer">📎 PDF tersimpan</a>
          )}
          <button className="btn" onClick={saveToCloud} disabled={savingPdf}>☁️ Simpan PDF ke Cloud</button>
          <button className="btn primary" onClick={() => window.print()}>🖨 Print / Save PDF</button>
        </span>
      </div>
      {saveMsg && (
        <div className="no-print" style={{ maxWidth: 820, margin: '0 auto 8px', padding: '0 16px' }}>
          <span className={saveMsg.startsWith('✓') ? 'upload-ok' : 'upload-hint'}>{saveMsg}</span>
          {doc.pdf_url && saveMsg.startsWith('✓') && (
            <a href={doc.pdf_url} target="_blank" rel="noreferrer" style={{ marginLeft: 8, fontSize: 13 }}>
              Buka PDF
            </a>
          )}
        </div>
      )}

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
                  <td>
                    <div style={{ fontWeight: 700 }}>{it.item_name || it.description}</div>
                    {it.item_name && it.description ? (
                      <div style={{ fontSize: 12, color: '#555' }}>{it.description}</div>
                    ) : null}
                  </td>
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
