// Pengiraan dokumen dikongsi oleh semua backend supaya keputusan konsisten.
export function computeTotals(items = [], discount = 0, taxRate = 0) {
  const subtotal = items.reduce(
    (s, it) => s + Number(it.quantity || 0) * Number(it.unit_price || 0),
    0
  )
  const disc = Number(discount || 0)
  const tax = ((subtotal - disc) * Number(taxRate || 0)) / 100
  const total = subtotal - disc + tax
  return { subtotal, tax, total }
}
