/**
 * Kaali API Client
 * Wraps all fetch calls to the backend. Handles auth tokens automatically.
 * Use this everywhere in the frontend instead of raw fetch.
 */

const BASE = process.env.NEXT_PUBLIC_APP_URL || ''

// ── Token management (browser only) ──────────────────────
export const token = {
  get:    ()      => typeof window !== 'undefined' ? localStorage.getItem('kaali_token') : null,
  set:    (t)     => typeof window !== 'undefined' && localStorage.setItem('kaali_token', t),
  clear:  ()      => typeof window !== 'undefined' && localStorage.removeItem('kaali_token'),
  exists: ()      => !!token.get(),
}

// ── Core fetch wrapper ────────────────────────────────────
async function api(path, options = {}) {
  const t = token.get()
  const headers = {
    'Content-Type': 'application/json',
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
    ...(options.headers || {}),
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  })

  // Token expired — clear and redirect to login
  if (res.status === 401) {
    token.clear()
    if (typeof window !== 'undefined') window.location.href = '/auth/login'
    throw new Error('Session expired. Please log in again.')
  }

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`)
  }

  return data
}

// Multipart (file uploads) — no Content-Type, browser sets boundary
async function apiForm(path, formData) {
  const t = token.get()
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: t ? { Authorization: `Bearer ${t}` } : {},
    body: formData,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`)
  return data
}

// ── AUTH ──────────────────────────────────────────────────
export const auth = {
  register: (body) => api('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login:    (body) => api('/api/auth/login',    { method: 'POST', body: JSON.stringify(body) }),
  me:       ()     => api('/api/auth/me'),
}

// ── TENANT ────────────────────────────────────────────────
export const tenant = {
  get:    ()     => api('/api/tenant'),
  update: (body) => api('/api/tenant', { method: 'PATCH', body: JSON.stringify(body) }),
}

// ── SERVICES ──────────────────────────────────────────────
export const services = {
  list:   ()     => api('/api/services'),
  add:    (body) => api('/api/services', { method: 'POST',   body: JSON.stringify(body) }),
  update: (body) => api('/api/services', { method: 'PATCH',  body: JSON.stringify(body) }),
  remove: (id)   => api(`/api/services?id=${id}`, { method: 'DELETE' }),
}

// ── DOCUMENTS ─────────────────────────────────────────────
export const documents = {
  list:   ()         => api('/api/documents'),
  upload: (formData) => apiForm('/api/documents', formData),
  remove: (id)       => api(`/api/documents?id=${id}`, { method: 'DELETE' }),
}

// ── LEADS ─────────────────────────────────────────────────
export const leads = {
  list:         (params = {}) => api('/api/leads?' + new URLSearchParams(params)),
  updateStatus: (id, status)  => api('/api/leads', { method: 'PATCH', body: JSON.stringify({ id, status }) }),
}

// ── CONVERSATIONS ─────────────────────────────────────────
export const conversations = {
  list:     (params = {})  => api('/api/conversations?' + new URLSearchParams(params)),
  messages: (id)           => api(`/api/conversations?id=${id}`),
}

// ── STATS ─────────────────────────────────────────────────
export const stats = {
  get: () => api('/api/stats'),
}

// ── STRIPE ────────────────────────────────────────────────
export const stripe = {
  createCheckout: (plan) => api('/api/stripe/checkout', { method: 'POST', body: JSON.stringify({ plan }) }),
  getPortal:      ()     => api('/api/stripe/portal',   { method: 'POST' }),
}

// ── CHAT (used by widget, no auth required) ───────────────
export const chat = {
  send: (body) => api('/api/chat', { method: 'POST', body: JSON.stringify(body) }),
}

// ── Helper: export leads as CSV ───────────────────────────
export function exportLeadsCSV(leadsList) {
  const headers = ['Name', 'Email', 'Type', 'Status', 'Date', 'Summary']
  const rows = leadsList.map(l => [
    l.name, l.email, l.visitor_type, l.status,
    new Date(l.created_at).toLocaleDateString('en-IN'),
    (l.summary || '').replace(/"/g, '""'),
  ].map(v => `"${v}"`))

  const csv  = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = 'kaali_leads.csv'; a.click()
  URL.revokeObjectURL(url)
}
