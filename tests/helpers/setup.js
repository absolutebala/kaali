/**
 * Test Setup & Teardown
 * Creates a fresh test tenant, returns auth token.
 * Cleans up via superadmin after tests.
 */

const BASE_URL = process.env.TEST_BASE_URL || 'https://kaali-complete-git-staging-oohads.vercel.app'

const TEST_TENANT = {
  firstName:   'Test',
  lastName:    'Automation',
  name:        'Test Automation',
  company:     'Test Company Automation',
  email:       `test-automation+${Date.now()}@absoluteapplabs.com`,
  password:    'TestPass123!',
}

let tenantToken = null
let tenantId    = null
let saToken     = null

async function api(path, opts = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  })
  const text = await res.text()
  try { return { status: res.status, data: JSON.parse(text) } }
  catch { return { status: res.status, data: text } }
}

async function setupTestTenant() {
  // Register test tenant
  const reg = await api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name:     TEST_TENANT.name,
      company:  TEST_TENANT.company,
      email:    TEST_TENANT.email,
      password: TEST_TENANT.password,
    }),
  })

  if (reg.status !== 200 && reg.status !== 201) {
    throw new Error(`Registration failed: ${JSON.stringify(reg.data)}`)
  }

  tenantToken = reg.data.token
  tenantId    = reg.data.tenant?.id

  return { token: tenantToken, tenantId, email: TEST_TENANT.email, password: TEST_TENANT.password }
}

async function setupSuperAdmin() {
  const res = await api('/api/superadmin/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email:    process.env.SUPERADMIN_EMAIL    || 'admin@absoluteapplabs.com',
      password: process.env.SUPERADMIN_PASSWORD || 'admin',
    }),
  })

  if (res.status !== 200) {
    throw new Error(`Superadmin login failed: ${JSON.stringify(res.data)}`)
  }

  saToken = res.data.token
  return saToken
}

async function teardownTestTenant() {
  if (!tenantId) return
  try {
    if (!saToken) await setupSuperAdmin()
    await api(`/api/superadmin/tenants`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${saToken}` },
      body: JSON.stringify({ id: tenantId }),
    })
    console.log(`✓ Cleaned up test tenant: ${tenantId}`)
  } catch (e) {
    console.warn(`⚠ Could not clean up test tenant ${tenantId}: ${e.message}`)
  }
}

function authHeader(token) {
  return { Authorization: `Bearer ${token || tenantToken}` }
}

module.exports = {
  BASE_URL,
  TEST_TENANT,
  api,
  setupTestTenant,
  setupSuperAdmin,
  teardownTestTenant,
  authHeader,
  getToken: () => tenantToken,
  getTenantId: () => tenantId,
  getSaToken: () => saToken,
}
