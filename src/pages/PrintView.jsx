import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import * as api from '../lib/db'
import { uploadPdf, isConfigured as cloudinaryReady } from '../lib/cloudinary'
import { typeOf } from '../lib/docTypes'
import { fmtMoney, fmtDate } from '../lib/format'

// Paparan cetak/PDF — templat ikut contoh rujukan (RAZZAQU) + bayaran:
// Tajuk besar → header (logo kiri, tajuk + blok syarikat kanan) → nombor/tarikh/Amount Due →
// BILL TO → jadual Items|Quantity|Price|Amount → Total → baris bayaran → Amount Due →
// Term & Conditions → Customer Sign | Company Seal | Authorised Signatory → footer.
export default function PrintView() {
  const { id } = useParams()
  const [doc, setDoc] = useState(null)
  const [profile, setProfile] = useState(null)
  const [payments, setPayments] = useState([])
  const [busy, setBusy] = useState('')
  const [saveMsg, setSaveMsg] = useState('')
  const [pdfBlob, setPdfBlob] = useState(null)

  useEffect(() => {
    api.getDocument(id)
      .then((d) => {
        setDoc(d)
        if (['invoice', 'tax_invoice', 'proforma'].includes(d.doc_type)) {
          api.listPayments(d.id).then(setPayments).catch(() => {})
        }
      })
      .catch(() => {})
    api.getProfile().then(setProfile).catch(() => {})
  }, [id])

  if (!doc) {
    return <div className="page"><p style={{ color: 'var(--muted)' }}>Loading…</p></div>
  }

  const type = typeOf(doc.doc_type)
  const totals = api.computeTotals(doc.items || [], doc.discount, doc.tax_rate)
  const isInvoice = ['invoice', 'tax_invoice', 'proforma'].includes(doc.doc_type)
  const isReceipt = type.isReceipt
  const totalPaid = (payments || []).reduce((s, p) => s + Number(p.amount || 0), 0)
  const amountDue = isReceipt ? totals.total : Math.max(totals.total - totalPaid, 0)
  const fileName = `${type.title}_${String(doc.customer_name || 'customer').replace(/[\\/:*?"<>|]/g, '')}_${type.prefix}${doc.doc_number}.pdf`

  // Jana blob PDF (A4, multi-page) daripada paparan cetak — useCORS supaya
  // imej Cloudinary (logo/cop/signature) turut dirender dalam PDF.
  async function generateBlob() {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ])
    const el = document.querySelector('.sheet')
    const canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    })
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
    const blob = pdf.output('blob')
    setPdfBlob(blob)
    return blob
  }

  async function downloadPdf() {
    setBusy('pdf')
    setSaveMsg('')
    try {
      const blob = pdfBlob || (await generateBlob())
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 3000)
    } catch (e) {
      setSaveMsg('Gagal: ' + (e?.message || e))
    }
    setBusy('')
  }

  async function sharePdf() {
    setBusy('pdf')
    setSaveMsg('')
    try {
      const blob = pdfBlob || (await generateBlob())
      const file = new File([blob], fileName, { type: 'application/pdf' })
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: fileName,
          text: `${type.title} ${type.prefix}-${doc.doc_number} — ${doc.customer_name}`,
        })
        setSaveMsg('✓ PDF dikongsi')
      } else {
        setSaveMsg('Peranti ini tidak menyokong share fail terus — guna ⬇️ Download PDF.')
      }
    } catch (e) {
      if (e?.name !== 'AbortError') setSaveMsg('Gagal: ' + (e?.message || e))
    }
    setBusy('')
  }

  async function saveToCloud() {
    if (!cloudinaryReady) {
      setSaveMsg('Cloudinary belum dikonfigur — lihat README (VITE_CLOUDINARY_*).')
      return
    }
    setBusy('cloud')
    setSaveMsg('Sedang jana PDF…')
    try {
      const blob = await generateBlob()
      setSaveMsg('Sedang upload ke Cloudinary…')
      const res = await uploadPdf(blob, fileName)
      await api.setPdfUrl(doc.id, res.secure_url)
      setSaveMsg('✓ PDF disimpan ke Cloud')
      setDoc((d) => ({ ...d, pdf_url: res.secure_url }))
    } catch (e) {
      setSaveMsg('Gagal: ' + (e?.message || e))
    }
    setBusy('')
  }

  return (
    <div>
      <div className="print-toolbar no-print">
        <Link to={`/doc/${doc.id}`}>← Kembali ke editor</Link>
        <span className="toolbar-group">
          {doc.pdf_url && (
            <a className="btn small" href={doc.pdf_url} target="_blank" rel="noreferrer">📎 PDF tersimpan</a>
          )}
          <button className="btn" onClick={downloadPdf} disabled={busy !== ''}>⬇️ Download PDF</button>
          <button className="btn gold" onClick={sharePdf} disabled={busy !== ''}>📤 Share PDF</button>
          <button className="btn" onClick={saveToCloud} disabled={busy !== ''}>☁️ Simpan ke Cloud</button>
          <button className="btn primary" onClick={() => window.print()}>🖨 Print</button>
        </span>
      </div>
      {saveMsg && (
        <div className="no-print" style={{ maxWidth: 820, margin: '0 auto 8px', padding: '0 16px' }}>
          <span className={saveMsg.startsWith('✓') ? 'upload-ok' : 'upload-hint'}>{saveMsg}</span>
          {doc.pdf_url && saveMsg.startsWith('✓') && (
            <a href={doc.pdf_url} target="_blank" rel="noreferrer" style={{ marginLeft: 8, fontSize: 13 }}>
              Buka PDF di Cloud
            </a>
          )}
        </div>
      )}

      <div className="print-wrap">
        <div className="sheet">
          <div className="inv-header">
            <div className="inv-logo">
              {profile?.logo_url && (
                <img src={profile.logo_url} crossOrigin="anonymous" alt="logo" />
              )}
              {profile?.name && <div className="inv-wordmark">{profile.name}</div>}
            </div>
            <div className="inv-head-right">
              <h1 className="inv-bigtitle">{type.title}</h1>
              <div className="inv-company">
                <h2>{profile?.name || '\u00A0'}</h2>
                <p>{profile?.address || ''}</p>
                {profile?.phone && <p>Mobile : {profile.phone}</p>}
                {profile?.email && <p>Email : {profile.email}</p>}
              </div>
            </div>
          </div>
          <hr className="inv-divider" />
          <div className="inv-nums">
            <div>
              <strong>{isReceipt ? 'Receipt Number' : isInvoice ? 'Invoice Number' : `${type.title} Number`} :</strong> {type.prefix}-{doc.doc_number ?? '—'}
            </div>
            <div>
              <strong>{isInvoice ? 'Invoice Date' : 'Date'} :</strong> {fmtDate(doc.issue_date)}
            </div>
            {!isReceipt && doc.due_date && (
              <div><strong>Payment Due Date :</strong> {fmtDate(doc.due_date)}</div>
            )}
            <div>
              <strong>{isReceipt ? 'Amount (MYR)' : 'Amount Due (MYR)'} :</strong> RM {Number(amountDue).toFixed(2)}
            </div>
          </div>

          <div className="inv-billto">
            <h3>{isReceipt ? 'Received From' : 'Bill To'}</h3>
            <p><strong>{doc.customer_name}</strong></p>
            {doc.customer_address && <p>{doc.customer_address}</p>}
            {doc.customer_phone && <p>{doc.customer_phone}</p>}
            {doc.customer_email && <p>{doc.customer_email}</p>}
          </div>

          <table className="items-table raz">
            <thead>
              <tr>
                <th>Items</th>
                <th className="r">Quantity</th>
                <th className="r">Price</th>
                <th className="r">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(doc.items || []).map((it, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{it.item_name || it.description}</div>
                    {it.item_name && it.description ? (
                      <div style={{ fontSize: 12, color: '#555' }}>{it.description}</div>
                    ) : null}
                  </td>
                  <td className="r">{it.quantity}</td>
                  <td className="r">{Number(it.unit_price || 0).toFixed(2)}</td>
                  <td className="r">{Number(it.amount ?? (Number(it.quantity) || 0) * (Number(it.unit_price) || 0)).toFixed(2)}</td>
                </tr>
              ))}
              {(doc.items || []).length === 0 && (
                <tr><td colSpan={4} style={{ color: '#999' }}>Tiada item.</td></tr>
              )}
            </tbody>
          </table>

          <div className="inv-totals">
            {Number(doc.discount) > 0 && (
              <div className="t"><span>Discount</span><span>- {fmtMoney(doc.discount)}</span></div>
            )}
            {Number(doc.tax_rate) > 0 && (
              <div className="t"><span>Tax ({doc.tax_rate}%)</span><span>{fmtMoney(totals.tax)}</span></div>
            )}
            <div className="t"><span>Total</span><span><b>RM {Number(totals.total).toFixed(2)}</b></span></div>
            {(payments || []).map((p) => (
              <div className="t" key={p.id}>
                <span>Payment on {fmtDate(p.pay_date)} using {p.method || 'payment'} (-)</span>
                <span>- RM {Number(p.amount).toFixed(2)}</span>
              </div>
            ))}
            <div className="t grand">
              <span>{isReceipt ? 'Amount Paid (MYR)' : 'Amount Due (MYR)'}</span>
              <span>RM {Number(amountDue).toFixed(2)}</span>
            </div>
          </div>

          {doc.notes && (
            <div className="inv-tnc">
              <h3>Term &amp; Conditions</h3>
              <p>{doc.notes}</p>
            </div>
          )}

          <p className="inv-thanks">Thank you for using us</p>

          <div className="inv-signs">
            <div>
              <div className="sign-area">{'\u00A0'}</div>
              <p>Customer Sign</p>
            </div>
            <div>
              <div className="sign-area">
                {profile?.stamp_url && <img src={profile.stamp_url} crossOrigin="anonymous" alt="Company Seal" />}
              </div>
              <p>Company Seal</p>
            </div>
            <div>
              <div className="sign-area">
                {profile?.signature_url && <img className="sig-img" src={profile.signature_url} crossOrigin="anonymous" alt="signature" />}
                {!profile?.signature_url && '\u00A0'}
              </div>
              <p>For {profile?.name || '\u00A0'}<br />Authorised Signatory</p>
            </div>
          </div>

          <footer className="inv-footer">
            <span>This is a computer Generated Invoice Created Using PcJeng Invoices</span>
            <span>Page 1 of 1</span>
          </footer>
        </div>
      </div>
    </div>
  )
}
