// Backend localStorage — demo mode bila Supabase belum dikonfigur.
// Bentuk data sama dengan backend Supabase supaya aplikasi tak perlu tahu bezaannya.
import { computeTotals } from './calc'
import { todayISO } from './format'

const PREFIX = 'invois_app_v1_'
const KEYS = {
  profile: PREFIX + 'profile',
  customers: PREFIX + 'customers',
  saved: PREFIX + 'saved_items',
  docs: PREFIX + 'documents',
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}
function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}
function uuid() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2)
}
function num(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

// ---------- company profile ----------
export async function getProfile() {
  return read(KEYS.profile, null)
}
export async function saveProfile(p) {
  const saved = { ...p, id: p.id || 'profile', updated_at: new Date().toISOString() }
  write(KEYS.profile, saved)
  return saved
}

// ---------- customers ----------
export async function listCustomers() {
  return read(KEYS.customers, []).sort((a, b) => String(a.name).localeCompare(String(b.name)))
}
export async function saveCustomer(c) {
  const list = read(KEYS.customers, [])
  if (c.id) {
    const i = list.findIndex((x) => x.id === c.id)
    if (i >= 0) list[i] = { ...list[i], ...c }
  } else {
    list.push({ ...c, id: uuid(), created_at: new Date().toISOString() })
  }
  write(KEYS.customers, list)
  return c
}
export async function deleteCustomer(id) {
  write(KEYS.customers, read(KEYS.customers, []).filter((x) => x.id !== id))
}

// ---------- saved items ----------
export async function listSavedItems() {
  return read(KEYS.saved, []).sort((a, b) => String(a.description).localeCompare(String(b.description)))
}
export async function saveSavedItem(item) {
  const list = read(KEYS.saved, [])
  if (item.id) {
    const i = list.findIndex((x) => x.id === item.id)
    if (i >= 0) list[i] = { ...list[i], ...item }
  } else {
    list.push({ ...item, id: uuid(), created_at: new Date().toISOString() })
  }
  write(KEYS.saved, list)
  return item
}
export async function deleteSavedItem(id) {
  write(KEYS.saved, read(KEYS.saved, []).filter((x) => x.id !== id))
}

// ---------- documents ----------
function cleanItems(items) {
  return (items || [])
    .filter((it) => String(it.item_name || '').trim() !== '' || String(it.description || '').trim() !== '')
    .map((it, i) => ({
      item_name: it.item_name || '',
      description: it.description || '',
      quantity: num(it.quantity),
      unit: it.unit || '',
      unit_price: num(it.unit_price),
      amount: num(it.quantity) * num(it.unit_price),
      position: i,
    }))
}

export async function nextDocNumber(typeId, issueDate) {
  const d = String(issueDate || todayISO()).slice(0, 10)
  const ymd = d.split('-').join('')
  const list = read(KEYS.docs, []).filter((x) => x.doc_type === typeId && String(x.issue_date || '').slice(0, 10) === d)
  let max = 0
  for (const x of list) {
    const s = String(x.doc_number || '')
    if (s.startsWith(ymd)) {
      const seq = parseInt(s.slice(-5), 10) || 0
      if (seq > max) max = seq
    }
  }
  return ymd + String(max + 1).padStart(5, '0')
}

export async function listDocuments(opts = {}) {
  let list = read(KEYS.docs, [])
  if (opts.type) list = list.filter((d) => d.doc_type === opts.type)
  if (!opts.includeArchived) list = list.filter((d) => !d.archived)
  return list.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
}

export async function getDocument(id) {
  const doc = read(KEYS.docs, []).find((d) => d.id === id)
  if (!doc) throw new Error('Document not found')
  return JSON.parse(JSON.stringify(doc))
}

export async function saveDocument(doc) {
  const items = cleanItems(doc.items)
  const totals = computeTotals(items, doc.discount, doc.tax_rate)
  const list = read(KEYS.docs, [])
  const base = {
    doc_type: doc.doc_type,
    doc_number: num(doc.doc_number),
    status: doc.status || 'Draft',
    issue_date: doc.issue_date || null,
    due_date: doc.due_date || null,
    customer_id: doc.customer_id || null,
    customer_name: doc.customer_name || '',
    customer_address: doc.customer_address || '',
    customer_phone: doc.customer_phone || '',
    customer_email: doc.customer_email || '',
    discount: num(doc.discount),
    tax_rate: num(doc.tax_rate),
    subtotal: totals.subtotal,
    total: totals.total,
    notes: doc.notes || '',
    payment_method: doc.payment_method || '',
    archived: !!doc.archived,
    items,
  }
  let savedId = doc.id
  if (doc.id) {
    const i = list.findIndex((d) => d.id === doc.id)
    if (i < 0) throw new Error('Document not found')
    list[i] = { ...list[i], ...base, updated_at: new Date().toISOString() }
    savedId = doc.id
  } else {
    savedId = uuid()
    list.push({ ...base, id: savedId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
  }
  write(KEYS.docs, list)
  return savedId
}

export async function deleteDocument(id) {
  write(KEYS.docs, read(KEYS.docs, []).filter((d) => d.id !== id))
}

export async function setArchived(id, archived) {
  const list = read(KEYS.docs, [])
  const d = list.find((x) => x.id === id)
  if (d) {
    d.archived = !!archived
    d.updated_at = new Date().toISOString()
    write(KEYS.docs, list)
  }
}

export async function setPdfUrl(id, url) {
  const list = read(KEYS.docs, [])
  const d = list.find((x) => x.id === id)
  if (d) {
    d.pdf_url = url
    d.updated_at = new Date().toISOString()
    write(KEYS.docs, list)
  }
}

// ---------- Auth / Admin (demo mode: tiada auth sebenar) ----------
export async function getMyRole() { return 'user' }
export async function adminListUsers() { throw new Error('Admin hanya tersedia dalam mod Supabase') }
export async function adminSetRole() { throw new Error('Admin hanya tersedia dalam mod Supabase') }
export async function adminSetBanned() { throw new Error('Admin hanya tersedia dalam mod Supabase') }
