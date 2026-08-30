// Backend Supabase (@supabase/supabase-js v2).
// Digunakan secara automatik oleh db.js bila VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY ada.
import { createClient } from '@supabase/supabase-js'
import { computeTotals } from './calc'

const client = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

function num(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

// ---------- company profile ----------
export async function getProfile() {
  const { data, error } = await client.from('company_profile').select('*').limit(1)
  if (error) throw error
  return data && data.length ? data[0] : null
}

export async function saveProfile(p) {
  const row = {
    name: p.name || '',
    address: p.address || '',
    phone: p.phone || '',
    email: p.email || '',
    logo_url: p.logo_url || '',
    signature_url: p.signature_url || '',
    default_tax_rate: num(p.default_tax_rate),
    updated_at: new Date().toISOString(),
  }
  if (p.id) {
    const { data, error } = await client.from('company_profile').update(row).eq('id', p.id).select().single()
    if (error) throw error
    return data
  }
  const { data, error } = await client.from('company_profile').insert(row).select().single()
  if (error) throw error
  return data
}

// ---------- customers ----------
export async function listCustomers() {
  const { data, error } = await client.from('customers').select('*').order('name')
  if (error) throw error
  return data || []
}

export async function saveCustomer(c) {
  const row = { name: c.name, address: c.address || '', phone: c.phone || '', email: c.email || '' }
  if (c.id) {
    const { data, error } = await client.from('customers').update(row).eq('id', c.id).select().single()
    if (error) throw error
    return data
  }
  const { data, error } = await client.from('customers').insert(row).select().single()
  if (error) throw error
  return data
}

export async function deleteCustomer(id) {
  const { error } = await client.from('customers').delete().eq('id', id)
  if (error) throw error
}

// ---------- saved items ----------
export async function listSavedItems() {
  const { data, error } = await client.from('saved_items').select('*').order('description')
  if (error) throw error
  return data || []
}

export async function saveSavedItem(item) {
  const row = { description: item.description, unit: item.unit || '', unit_price: num(item.unit_price) }
  if (item.id) {
    const { data, error } = await client.from('saved_items').update(row).eq('id', item.id).select().single()
    if (error) throw error
    return data
  }
  const { data, error } = await client.from('saved_items').insert(row).select().single()
  if (error) throw error
  return data
}

export async function deleteSavedItem(id) {
  const { error } = await client.from('saved_items').delete().eq('id', id)
  if (error) throw error
}

// ---------- documents ----------
export async function nextDocNumber(typeId) {
  const { data, error } = await client
    .from('documents')
    .select('doc_number')
    .eq('doc_type', typeId)
    .order('doc_number', { ascending: false })
    .limit(1)
  if (error) throw error
  const max = data && data.length ? num(data[0].doc_number) : 0
  return Math.max(max + 1, 100)
}

export async function listDocuments(opts = {}) {
  let q = client.from('documents').select('*').order('created_at', { ascending: false })
  if (opts.type) q = q.eq('doc_type', opts.type)
  if (!opts.includeArchived) q = q.eq('archived', false)
  const { data, error } = await q
  if (error) throw error
  return data || []
}

export async function getDocument(id) {
  const { data: doc, error } = await client.from('documents').select('*').eq('id', id).single()
  if (error) throw error
  const { data: items, error: err2 } = await client
    .from('document_items')
    .select('*')
    .eq('document_id', id)
    .order('position')
  if (err2) throw err2
  return { ...doc, items: items || [] }
}

export async function saveDocument(doc) {
  const items = (doc.items || []).filter((it) => String(it.description || '').trim() !== '')
  const totals = computeTotals(items, doc.discount, doc.tax_rate)

  const row = {
    doc_type: doc.doc_type,
    doc_number: num(doc.doc_number) || null,
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
    updated_at: new Date().toISOString(),
  }

  let docId = doc.id
  if (docId) {
    const { error } = await client.from('documents').update(row).eq('id', docId)
    if (error) throw error
    // items diganti penuh setiap kali simpan (skala peribadi — cukup mudah)
    const { error: eDel } = await client.from('document_items').delete().eq('document_id', docId)
    if (eDel) throw eDel
  } else {
    const { data, error } = await client.from('documents').insert(row).select('id').single()
    if (error) throw error
    docId = data.id
  }

  const rows = items.map((it, i) => ({
    document_id: docId,
    position: i,
    description: it.description,
    quantity: num(it.quantity),
    unit: it.unit || '',
    unit_price: num(it.unit_price),
    amount: num(it.quantity) * num(it.unit_price),
  }))
  if (rows.length) {
    const { error: eIns } = await client.from('document_items').insert(rows)
    if (eIns) throw eIns
  }
  return docId
}

export async function deleteDocument(id) {
  const { error } = await client.from('documents').delete().eq('id', id)
  if (error) throw error
}

export async function setArchived(id, archived) {
  const { error } = await client
    .from('documents')
    .update({ archived: !!archived, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
