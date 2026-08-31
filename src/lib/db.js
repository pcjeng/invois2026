import { todayISO } from './format'
import * as local from './db.local'

export { computeTotals } from './calc'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const usingSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
export const authAvailable = usingSupabase

let supaPromise = null
function getBackend() {
  if (usingSupabase) {
    // Import dinamik supaya createClient tidak terpakai semasa demo mode
    if (!supaPromise) supaPromise = import('./db.supabase')
    return supaPromise
  }
  return Promise.resolve(local)
}

export async function nextDocNumber(typeId) { return (await getBackend()).nextDocNumber(typeId) }
export async function getProfile() { return (await getBackend()).getProfile() }
export async function saveProfile(p) { return (await getBackend()).saveProfile(p) }
export async function listCustomers() { return (await getBackend()).listCustomers() }
export async function saveCustomer(c) { return (await getBackend()).saveCustomer(c) }
export async function deleteCustomer(id) { return (await getBackend()).deleteCustomer(id) }
export async function listSavedItems() { return (await getBackend()).listSavedItems() }
export async function saveSavedItem(i) { return (await getBackend()).saveSavedItem(i) }
export async function deleteSavedItem(id) { return (await getBackend()).deleteSavedItem(id) }
export async function listDocuments(opts = {}) { return (await getBackend()).listDocuments(opts) }
export async function getDocument(id) { return (await getBackend()).getDocument(id) }
export async function saveDocument(doc) { return (await getBackend()).saveDocument(doc) }
export async function deleteDocument(id) { return (await getBackend()).deleteDocument(id) }
export async function setArchived(id, archived) { return (await getBackend()).setArchived(id, archived) }

// ---------- Auth (Supabase sahaja; demo mode tiada login) ----------
export async function getSession() {
  if (!usingSupabase) return null
  return (await getBackend()).getSession()
}
export async function signIn(email, password) {
  return (await getBackend()).signIn(email, password)
}
export async function signOut() {
  return (await getBackend()).signOut()
}
export async function onAuthStateChange(cb) {
  if (!usingSupabase) return () => {}
  const b = await getBackend()
  return b.onAuthStateChange(cb)
}

export function emptyDocument(typeId = 'quote') {
  return {
    id: null,
    doc_type: typeId,
    doc_number: '',
    status: 'Draft',
    issue_date: todayISO(),
    due_date: '',
    customer_id: null,
    customer_name: '',
    customer_address: '',
    customer_phone: '',
    customer_email: '',
    discount: 0,
    tax_rate: 0,
    notes: '',
    payment_method: '',
    archived: false,
    items: [],
  }
}
