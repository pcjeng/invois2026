// 12 jenis dokumen — susunan ikut skrin "Switch Document" aplikasi rujukan.
export const DOC_TYPES = [
  { id: 'invoice',        label: 'Invoice',          title: 'INVOICE',          prefix: 'INV',  color: '#7E57C2', isReceipt: false },
  { id: 'tax_invoice',    label: 'Tax Invoice',      title: 'TAX INVOICE',      prefix: 'TINV', color: '#5C6BC0', isReceipt: false },
  { id: 'proforma',       label: 'Proforma Invoice', title: 'PROFORMA INVOICE', prefix: 'PINV', color: '#42A5F5', isReceipt: false },
  { id: 'receipt',        label: 'Receipt',          title: 'RECEIPT',          prefix: 'RCP',  color: '#26A69A', isReceipt: true },
  { id: 'sales_receipt',  label: 'Sales Receipt',    title: 'SALES RECEIPT',    prefix: 'SRCP', color: '#66BB6A', isReceipt: true },
  { id: 'cash_receipt',   label: 'Cash Receipt',     title: 'CASH RECEIPT',     prefix: 'CRCP', color: '#9CCC65', isReceipt: true },
  { id: 'quote',          label: 'Quote',            title: 'QUOTATION',        prefix: 'QUO',  color: '#FFA726', isReceipt: false },
  { id: 'estimate',       label: 'Estimate',         title: 'ESTIMATE',         prefix: 'EST',  color: '#EC407A', isReceipt: false },
  { id: 'credit_memo',    label: 'Credit Memo',      title: 'CREDIT MEMO',      prefix: 'CMEM', color: '#EF5350', isReceipt: false },
  { id: 'credit_note',    label: 'Credit Note',      title: 'CREDIT NOTE',      prefix: 'CN',   color: '#AB47BC', isReceipt: false },
  { id: 'purchase_order', label: 'Purchase Order',   title: 'PURCHASE ORDER',   prefix: 'PO',   color: '#29B6F6', isReceipt: false },
  { id: 'delivery_note',  label: 'Delivery Note',    title: 'DELIVERY NOTE',    prefix: 'DN',   color: '#26C6DA', isReceipt: false },
]

export const TYPE_MAP = Object.fromEntries(DOC_TYPES.map((t) => [t.id, t]))

export function typeOf(id) {
  return TYPE_MAP[id] || TYPE_MAP.quote
}

const STATUS_OPTIONS = {
  invoice: ['Draft', 'Sent', 'Paid', 'Overdue'],
  tax_invoice: ['Draft', 'Sent', 'Paid', 'Overdue'],
  quote: ['Draft', 'Sent', 'Accepted', 'Rejected'],
  estimate: ['Draft', 'Sent', 'Accepted', 'Rejected'],
  receipt: ['Completed'],
  sales_receipt: ['Completed'],
  cash_receipt: ['Completed'],
}

export function statusOptionsFor(typeId) {
  return STATUS_OPTIONS[typeId] || ['Draft', 'Sent']
}

export const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Card', 'Cheque', 'e-Wallet']
