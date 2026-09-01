// Backend Supabase (@supabase/supabase-js v2) — versi SaaS multi-pengguna.
// Setiap baris data dibawa user_id; RLS di Supabase mengasingkan data setiap pengguna.
import { createClient } from '@supabase/supabase-js'
import { computeTotals } from './calc'
import { todayISO } from './format'

const client = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

function num(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

// ID pengguna yang sedang login (diperlukan untuk setiap tulisan)
async function uid() {
  const { data } = await client.auth.getSession()
  return data.session?.user?.id || null
}

// ---------- Auth ----------
export async function getSession() {
  const { data, error } = await client.auth.getSession()
  if (error) throw error
  return data.session
}

export async function signIn(email, password) {
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw error
}

// Balik { needsEmailConfirm } — kalau Supabase minta pengesahan email, session tak tercipta lagi
export async function signUp(email, password) {
  const { data, error } = await client.auth.signUp({ email, password })
  if (error) throw error
  return { needsEmailConfirm: !data.session }
}

export async function sendPasswordReset(email) {
  const { error } = await client.auth.resetPasswordForEmail(email)
  if (error) throw error
}

export async function updatePassword(password) {
  const { error } = await client.auth.updateUser({ password })
  if (error) throw error
}

export async function signOut() {
  const { error } = await client.auth.signOut()
  if (error) throw error
}

export function onAuthStateChange(cb) {
  const { data } = client.auth.onAuthStateChange((evt, session) => cb(evt, session))
  return () => data.subscription.unsubscribe()
}

// Peranan pengguna semasa ('admin' | 'user') dari app_metadata JWT
export async function getMyRole() {
  const { data } = await client.auth.getSession()
  return data.session?.user?.app_metadata?.role || 'user'
}

// ---------- RPC Admin (fungsi security definer di Supabase) ----------
export async function adminListUsers() {
  const { data, error } = await client.rpc('admin_list_users')
  if (error) throw error
  return data || []
}

export async function adminSetRole(target, newRole) {
  const { error } = await client.rpc('admin_set_role', { target, new_role: newRole })
  if (error) throw error
}

export async function adminSetBanned(target, banned) {
  const { error } = await client.rpc('admin_set_banned', { target, banned })
  if (error) throw error
}

// ---------- company profile (satu baris setiap pengguna) ----------
export async function getProfile() {
  const u = await uid()
  if (!u) return null
  const { data, error } = await client
    .from('company_profile')
    .select('*')
    .eq('user_id', u)
    .limit(1)
  if (error) throw error
  return data && data.length ? data[0] : null
}

export async function saveProfile(p) {
  const u = await uid()
  if (!u) throw new Error('Belum log masuk')
  const row = {
    name: p.name || '',
    address: p.address || '',
    phone: p.phone || '',
    email: p.email || '',
    logo_url: p.logo_url || '',
    signature_url: p.signature_url || '',
    stamp_url: p.stamp_url || '',
    default_tax_rate: num(p.default_tax_rate),
    updated_at: new Date().toISOString(),
  }
  if (p.id) {
    const { data, error } = await client.from('company_profile').update(row).eq('id', p.id).select().single()
    if (error) throw error
    return data
  }
  const { data, error } = await client.from('company_profile').insert({ ...row, user_id: u }).select().single()
  if (error) throw error
  return data
}

// ---------- customers ----------
export async function listCustomers() {
  const u = await uid()
  if (!u) return []
  const { data, error } = await client.from('customers').select('*').eq('user_id', u).order('name')
  if (error) throw error
  return data || []
}

export async function saveCustomer(c) {
  const u = await uid()
  if (!u) throw new Error('Belum log masuk')
  const row = { name: c.name, address: c.address || '', phone: c.phone || '', email: c.email || '' }
  if (c.id) {
    const { data, error } = await client.from('customers').update(row).eq('id', c.id).select().single()
    if (error) throw error
    return data
  }
  const { data, error } = await client.from('customers').insert({ ...row, user_id: u }).select().single()
  if (error) throw error
  return data
}

export async function deleteCustomer(id) {
  const { error } = await client.from('customers').delete().eq('id', id)
  if (error) throw error
}

// ---------- saved items ----------
export async function listSavedItems() {
  const u = await uid()
  if (!u) return []
  const { data, error } = await client.from('saved_items').select('*').eq('user_id', u).order('description')
  if (error) throw error
  return data || []
}

export async function saveSavedItem(item) {
  const u = await uid()
  if (!u) throw new Error('Belum log masuk')
  const row = { description: item.description, unit: item.unit || '', unit_price: num(item.unit_price) }
  if (item.id) {
    const { data, error } = await client.from('saved_items').update(row).eq('id', item.id).select().single()
    if (error) throw error
    return data
  }
  const { data, error } = await client.from('saved_items').insert({ ...row, user_id: u }).select().single()
  if (error) throw error
  return data
}

export async function deleteSavedItem(id) {
  const { error } = await client.from('saved_items').delete().eq('id', id)
  if (error) throw error
}

// ---------- documents ----------
// Format no. dokumen: YYYYMMDD + turutan 5 digit (cth: 2026090100001).
// Turutan dikira berasingan bagi setiap jenis dokumen + tarikh + pengguna.
export async function nextDocNumber(typeId, issueDate) {
  const u = await uid()
  if (!u) throw new Error('Belum log masuk')
  const d = issueDate || todayISO()
  const ymd = String(d).slice(0, 10).split('-').join('')
  const { data, error } = await client
    .from('documents')
    .select('doc_number')
    .eq('doc_type', typeId)
    .eq('user_id', u)
    .eq('issue_date', d)
  if (error) throw error
  let max = 0
  for (const r of data || []) {
    const s = String(r.doc_number || '')
    if (s.startsWith(ymd)) {
      const seq = parseInt(s.slice(-5), 10) || 0
      if (seq > max) max = seq
    }
  }
  return ymd + String(max + 1).padStart(5, '0')
}

export async function listDocuments(opts = {}) {
  const u = await uid()
  if (!u) return []
  let q = client.from('documents').select('*').eq('user_id', u).order('created_at', { ascending: false })
  if (opts.type) q = q.eq('doc_type', opts.type)
  if (!opts.includeArchived) q = q.eq('archived', false)
  const { data, error } = await q
  if (error) throw error
  return data || []
}

export async function getDocument(id) {
  const u = await uid()
  if (!u) throw new Error('Belum log masuk')
  const { data: doc, error } = await client
    .from('documents')
    .select('*')
    .eq('id', id)
    .eq('user_id', u)
    .single()
  if (error) throw error
  const { data: items, error: err2 } = await client
    .from('document_items')
    .select('*')
    .eq('document_id', id)
    .eq('user_id', u)
    .order('position')
  if (err2) throw err2
  return { ...doc, items: items || [] }
}

export async function saveDocument(doc) {
  const u = await uid()
  if (!u) throw new Error('Belum log masuk')
  const items = (doc.items || []).filter(
    (it) => String(it.item_name || '').trim() !== '' || String(it.description || '').trim() !== ''
  )
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
    const { error } = await client.from('documents').update(row).eq('id', docId).eq('user_id', u)
    if (error) throw error
    const { error: eDel } = await client.from('document_items').delete().eq('document_id', docId).eq('user_id', u)
    if (eDel) throw eDel
  } else {
    const { data, error } = await client.from('documents').insert({ ...row, user_id: u }).select('id').single()
    if (error) throw error
    docId = data.id
  }

  const rows = items.map((it, i) => ({
    document_id: docId,
    user_id: u,
    position: i,
    item_name: it.item_name || '',
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

export async function setPdfUrl(id, url) {
  const u = await uid()
  if (!u) throw new Error('Belum log masuk')
  const { error } = await client
    .from('documents')
    .update({ pdf_url: url, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', u)
  if (error) throw error
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

// ---------- Payments (bayaran invois) ----------
export async function listPayments(documentId) {
  const u = await uid()
  if (!u) return []
  const { data, error } = await client
    .from('payments')
    .select('*')
    .eq('document_id', documentId)
    .eq('user_id', u)
    .order('pay_date')
  if (error) throw error
  return data || []
}

export async function addPayment(p) {
  const u = await uid()
  if (!u) throw new Error('Belum log masuk')
  const { data, error } = await client
    .from('payments')
    .insert({
      document_id: p.document_id,
      user_id: u,
      pay_date: p.pay_date || null,
      method: p.method || '',
      amount: num(p.amount),
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deletePayment(id) {
  const { error } = await client.from('payments').delete().eq('id', id)
  if (error) throw error
}
