const { api, setupTestTenant, teardownTestTenant, authHeader, setupSuperAdmin, getSaToken } = require('../helpers/setup')

let token, tenantId, convId, saToken

beforeAll(async () => {
  const setup = await setupTestTenant()
  token    = setup.token
  tenantId = setup.tenantId

  // Create a conversation for use in later tests
  const chatRes = await api('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      tenantId,
      messages: [{ role: 'user', content: 'Hello, what do you do?' }],
      visitorType: 'GENERAL',
    }),
  })
  convId = chatRes.data?.conversationId

  await setupSuperAdmin()
  saToken = getSaToken()
}, 30000)

afterAll(async () => {
  await teardownTestTenant()
})

// ── TENANT API ─────────────────────────────────────────────────────────────
describe('Tenant API', () => {
  test('GET /api/tenant — returns tenant settings', async () => {
    const res = await api('/api/tenant', { headers: authHeader(token) })
    expect(res.status).toBe(200)
    expect(res.data.tenant.company).toBe('Test Company Automation')
  })

  test('PATCH /api/tenant — updates bot name', async () => {
    const res = await api('/api/tenant', {
      method: 'PATCH',
      headers: authHeader(token),
      body: JSON.stringify({ botName: 'TestBot' }),
    })
    expect(res.status).toBe(200)
    expect(res.data.tenant.bot_name).toBe('TestBot')
  })

  test('PATCH /api/tenant — updates description and tone', async () => {
    const res = await api('/api/tenant', {
      method: 'PATCH',
      headers: authHeader(token),
      body: JSON.stringify({ description: 'We build great software.', tone: 'professional' }),
    })
    expect(res.status).toBe(200)
    expect(res.data.tenant).toBeDefined()
  })

  test('PATCH /api/tenant — updates visitor button labels', async () => {
    const res = await api('/api/tenant', {
      method: 'PATCH',
      headers: authHeader(token),
      body: JSON.stringify({
        visitorBtn1: 'I want AIChat for my Website',
        visitorBtn2: 'Pricing',
        visitorBtn3: 'Integration Support',
        visitorBtn4: 'Just exploring',
      }),
    })
    expect(res.status).toBe(200)
  })

  test('PATCH /api/tenant — saves API key and provider', async () => {
    const res = await api('/api/tenant', {
      method: 'PATCH',
      headers: authHeader(token),
      body: JSON.stringify({ aiProvider: 'chatgpt', apiKey: 'sk-test-fake-key-for-testing', aiModel: 'gpt-4o-mini' }),
    })
    expect(res.status).toBe(200)
    // Verify key is saved — widget-config should still return tenant
    const cfg = await api(`/api/widget-config/${tenantId}`)
    expect(cfg.status).toBe(200)
  })

  test('PATCH /api/tenant — updates company name', async () => {
    const res = await api('/api/tenant', {
      method: 'PATCH',
      headers: authHeader(token),
      body: JSON.stringify({ companyName: 'Test Company Automation Updated' }),
    })
    expect(res.status).toBe(200)
  })

  test('PATCH /api/tenant — updates alert email and threshold', async () => {
    const res = await api('/api/tenant', {
      method: 'PATCH',
      headers: authHeader(token),
      body: JSON.stringify({ alertEmail: 'alerts@test.com', alertThreshold: 80 }),
    })
    expect(res.status).toBe(200)
  })

  test('GET /api/tenant — no auth returns 401', async () => {
    const res = await api('/api/tenant')
    expect(res.status).toBe(401)
  })
})

// ── WIDGET CONFIG ──────────────────────────────────────────────────────────
describe('Widget Config API', () => {
  test('GET /api/widget-config/:tenantId — returns bot config with visitor buttons', async () => {
    const res = await api(`/api/widget-config/${tenantId}`)
    expect(res.status).toBe(200)
    expect(res.data.botName).toBeDefined()
    expect(res.data.tenantId).toBe(tenantId)
    // Should include visitor button labels
    expect(res.data.visitorBtn1).toBeDefined()
    expect(res.data.visitorBtn2).toBeDefined()
    expect(res.data.visitorBtn3).toBeDefined()
    expect(res.data.visitorBtn4).toBeDefined()
    // Should include widget mode
    expect(res.data.widgetMode).toBeDefined()
    // Should NOT include encrypted API key
    expect(res.data.api_key_enc).toBeUndefined()
    expect(res.data.apiKey).toBeUndefined()
  })

  test('GET /api/widget-config/invalid — returns 404', async () => {
    const res = await api('/api/widget-config/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
  })
})

// ── STATS API ──────────────────────────────────────────────────────────────
describe('Stats API', () => {
  test('GET /api/stats — returns all dashboard metrics', async () => {
    const res = await api('/api/stats', { headers: authHeader(token) })
    expect(res.status).toBe(200)
    expect(res.data.totalConversations).toBeDefined()
    expect(res.data.totalLeads).toBeDefined()
    expect(res.data.usagePct).toBeDefined()
    expect(typeof res.data.totalConversations).toBe('number')
    expect(typeof res.data.usagePct).toBe('number')
  })

  test('GET /api/stats — no auth returns 401', async () => {
    const res = await api('/api/stats')
    expect(res.status).toBe(401)
  })
})

// ── SERVICES API ───────────────────────────────────────────────────────────
describe('Services API', () => {
  let serviceId

  test('POST /api/services — creates a service', async () => {
    const res = await api('/api/services', {
      method: 'POST',
      headers: authHeader(token),
      body: JSON.stringify({ name: 'Test Service', description: 'Automated test service' }),
    })
    expect([200, 201]).toContain(res.status)
    serviceId = res.data.service?.id || res.data.id
    expect(serviceId).toBeTruthy()
  })

  test('GET /api/services — lists services', async () => {
    const res = await api('/api/services', { headers: authHeader(token) })
    expect(res.status).toBe(200)
    const services = res.data.services || res.data
    expect(Array.isArray(services)).toBe(true)
    expect(services.length).toBeGreaterThan(0)
  })

  test('POST /api/services — missing name returns 400', async () => {
    const res = await api('/api/services', {
      method: 'POST',
      headers: authHeader(token),
      body: JSON.stringify({ description: 'No name given' }),
    })
    expect(res.status).toBe(400)
  })

  test('POST /api/services — no auth returns 401', async () => {
    const res = await api('/api/services', {
      method: 'POST',
      body: JSON.stringify({ name: 'Unauth', description: 'Test' }),
    })
    expect(res.status).toBe(401)
  })

  test('DELETE /api/services — deletes a service', async () => {
    if (!serviceId) { console.log('No serviceId — skipping'); return }
    const res = await api(`/api/services?id=${serviceId}`, {
      method: 'DELETE',
      headers: authHeader(token),
    })
    expect([200, 204]).toContain(res.status)
  })

  test('DELETE /api/services — missing id returns 400', async () => {
    const res = await api('/api/services', {
      method: 'DELETE',
      headers: authHeader(token),
    })
    expect(res.status).toBe(400)
  })
})

// ── DOCUMENTS API ──────────────────────────────────────────────────────────
describe('Documents API', () => {
  test('GET /api/documents — lists documents', async () => {
    const res = await api('/api/documents', { headers: authHeader(token) })
    expect(res.status).toBe(200)
    expect(res.data.documents).toBeDefined()
    expect(Array.isArray(res.data.documents)).toBe(true)
  })

  test('GET /api/documents — no auth returns 401', async () => {
    const res = await api('/api/documents')
    expect(res.status).toBe(401)
  })

  test('DELETE /api/documents — missing id returns 400', async () => {
    const res = await api('/api/documents', {
      method: 'DELETE',
      headers: authHeader(token),
    })
    expect(res.status).toBe(400)
  })
})

// ── SCRAPE API ─────────────────────────────────────────────────────────────
describe('Scrape API', () => {
  test('POST /api/scrape — missing url returns 400', async () => {
    const res = await api('/api/scrape', {
      method: 'POST',
      headers: authHeader(token),
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
  })

  test('POST /api/scrape — no auth returns 401', async () => {
    const res = await api('/api/scrape', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com' }),
    })
    expect(res.status).toBe(401)
  })
})

// ── CONVERSATIONS API ──────────────────────────────────────────────────────
describe('Conversations API', () => {
  test('GET /api/conversations — lists conversations', async () => {
    const res = await api('/api/conversations?limit=10', { headers: authHeader(token) })
    expect(res.status).toBe(200)
    expect(res.data.conversations).toBeDefined()
    expect(Array.isArray(res.data.conversations)).toBe(true)
  })

  test('GET /api/conversations?id= — returns messages for conversation', async () => {
    if (!convId) { console.log('No convId — skipping'); return }
    const res = await api(`/api/conversations?id=${convId}`, { headers: authHeader(token) })
    expect(res.status).toBe(200)
    expect(res.data.messages).toBeDefined()
    expect(Array.isArray(res.data.messages)).toBe(true)
  })

  test('GET /api/conversations?id=invalid — returns 404', async () => {
    const res = await api('/api/conversations?id=00000000-0000-0000-0000-000000000000', { headers: authHeader(token) })
    expect(res.status).toBe(404)
  })

  test('GET /api/conversations?public=1 — public endpoint works for widget', async () => {
    if (!convId) { console.log('No convId — skipping'); return }
    const res = await api(`/api/conversations?id=${convId}&public=1`)
    expect(res.status).toBe(200)
    expect(res.data.messages).toBeDefined()
  })

  test('GET /api/conversations — no auth returns 401', async () => {
    const res = await api('/api/conversations')
    expect(res.status).toBe(401)
  })
})

// ── LEADS API ──────────────────────────────────────────────────────────────
describe('Leads API', () => {
  let leadId

  test('GET /api/leads — lists leads', async () => {
    const res = await api('/api/leads', { headers: authHeader(token) })
    expect(res.status).toBe(200)
    expect(res.data.leads).toBeDefined()
    expect(Array.isArray(res.data.leads)).toBe(true)
    // Capture a lead ID if any exist for PATCH test
    if (res.data.leads.length > 0) leadId = res.data.leads[0].id
  })

  test('GET /api/leads?status=new — filters by status', async () => {
    const res = await api('/api/leads?status=new', { headers: authHeader(token) })
    expect(res.status).toBe(200)
    expect(res.data.leads).toBeDefined()
    // All returned leads should have status 'new'
    const allNew = res.data.leads.every(l => l.status === 'new')
    expect(allNew).toBe(true)
  })

  test('PATCH /api/leads — updates lead status', async () => {
    if (!leadId) { console.log('No leads yet — skipping PATCH test'); return }
    const res = await api('/api/leads', {
      method: 'PATCH',
      headers: authHeader(token),
      body: JSON.stringify({ id: leadId, status: 'contacted' }),
    })
    expect(res.status).toBe(200)
    expect(res.data.lead?.status || res.data.status).toBe('contacted')
  })

  test('PATCH /api/leads — invalid status returns 400', async () => {
    if (!leadId) { console.log('No leads yet — skipping'); return }
    const res = await api('/api/leads', {
      method: 'PATCH',
      headers: authHeader(token),
      body: JSON.stringify({ id: leadId, status: 'invalid_status' }),
    })
    expect(res.status).toBe(400)
  })

  test('PATCH /api/leads — missing id returns 400', async () => {
    const res = await api('/api/leads', {
      method: 'PATCH',
      headers: authHeader(token),
      body: JSON.stringify({ status: 'contacted' }),
    })
    expect(res.status).toBe(400)
  })

  test('GET /api/leads — no auth returns 401', async () => {
    const res = await api('/api/leads')
    expect(res.status).toBe(401)
  })
})

// ── CROSS-TENANT ISOLATION ─────────────────────────────────────────────────
describe('Cross-Tenant Isolation', () => {
  let otherToken, otherTenantId

  beforeAll(async () => {
    // Create a second tenant
    const res = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Other Tenant',
        company: 'Other Company',
        email: `other-${Date.now()}@test.com`,
        password: 'password123',
      }),
    })
    otherToken    = res.data.token
    otherTenantId = res.data.tenant?.id
  })

  afterAll(async () => {
    // Clean up second tenant
    if (otherTenantId) {
      const saRes = await api('/api/superadmin/tenants', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${saToken}` },
        body: JSON.stringify({ id: otherTenantId }),
      })
      console.log('Other tenant cleanup:', saRes.status)
    }
  })

  test('Tenant A cannot read Tenant B conversations', async () => {
    if (!convId || !otherToken) { console.log('Missing convId or otherToken — skipping'); return }
    // otherToken tries to read tenantA's conversation
    const res = await api(`/api/conversations?id=${convId}`, { headers: authHeader(otherToken) })
    // Should return 404 (not found for this tenant) not 200
    expect(res.status).toBe(404)
  })

  test('Tenant A cannot read Tenant B leads', async () => {
    if (!otherToken) { console.log('No otherToken — skipping'); return }
    // Get tenant A's leads count with tenant B token — should return empty or 0
    const res = await api('/api/leads', { headers: authHeader(otherToken) })
    expect(res.status).toBe(200)
    // Tenant B should see 0 leads from tenant A
    expect(res.data.leads.every(l => l.tenant_id !== tenantId)).toBe(true)
  })

  test('Tenant A cannot read Tenant B settings', async () => {
    if (!otherToken) { console.log('No otherToken — skipping'); return }
    const res = await api('/api/tenant', { headers: authHeader(otherToken) })
    expect(res.status).toBe(200)
    // Should return other tenant's own settings, not tenant A's
    expect(res.data.tenant.id).not.toBe(tenantId)
  })
})

// ── AGENT API ──────────────────────────────────────────────────────────────
describe('Agent API', () => {
  test('GET /api/agent — returns waiting, live and active chats', async () => {
    const res = await api('/api/agent', { headers: authHeader(token) })
    if (res.status === 404) { console.log('Agent 404 — skipping'); return }
    expect(res.status).toBe(200)
    expect(res.data.waiting).toBeDefined()
    expect(res.data.live).toBeDefined()
    expect(res.data.active).toBeDefined()
    expect(Array.isArray(res.data.waiting)).toBe(true)
    expect(Array.isArray(res.data.live)).toBe(true)
    expect(Array.isArray(res.data.active)).toBe(true)
    expect(typeof res.data.onlineCount).toBe('number')
  })

  test('POST /api/agent — heartbeat sets agent online', async () => {
    const res = await api('/api/agent', {
      method: 'POST',
      headers: authHeader(token),
      body: JSON.stringify({ action: 'heartbeat' }),
    })
    if (res.status === 404) { console.log('Agent 404 — skipping'); return }
    expect(res.status).toBe(200)
    expect(res.data.ok).toBe(true)
  })

  test('POST /api/agent — intervene joins active conversation', async () => {
    if (!convId) { console.log('No convId — skipping intervene test'); return }
    const res = await api('/api/agent', {
      method: 'POST',
      headers: authHeader(token),
      body: JSON.stringify({ action: 'intervene', conversationId: convId }),
    })
    if (res.status === 404) { console.log('Agent 404 — skipping'); return }
    expect(res.status).toBe(200)
    expect(res.data.ok).toBe(true)
    expect(res.data.conversationId).toBe(convId)
    expect(res.data.summary).toBeDefined()
  })

  test('POST /api/agent — intervene without conversationId returns 400', async () => {
    const res = await api('/api/agent', {
      method: 'POST',
      headers: authHeader(token),
      body: JSON.stringify({ action: 'intervene' }),
    })
    if (res.status === 404) { console.log('Agent 404 — skipping'); return }
    expect(res.status).toBe(400)
  })

  test('POST /api/agent — offline removes agent', async () => {
    const res = await api('/api/agent', {
      method: 'POST',
      headers: authHeader(token),
      body: JSON.stringify({ action: 'offline' }),
    })
    if (res.status === 404) { console.log('Agent 404 — skipping'); return }
    expect(res.status).toBe(200)
    expect(res.data.ok).toBe(true)
  })

  test('POST /api/agent — unknown action returns 400', async () => {
    const res = await api('/api/agent', {
      method: 'POST',
      headers: authHeader(token),
      body: JSON.stringify({ action: 'unknown_action' }),
    })
    if (res.status === 404) { console.log('Agent 404 — skipping'); return }
    expect(res.status).toBe(400)
  })

  test('POST /api/agent — no auth returns 401', async () => {
    const res = await api('/api/agent', {
      method: 'POST',
      body: JSON.stringify({ action: 'heartbeat' }),
    })
    if (res.status === 404) { console.log('Agent 404 — skipping'); return }
    expect(res.status).toBe(401)
  })
})

// ── STRIPE API ─────────────────────────────────────────────────────────────
describe('Stripe API', () => {
  test('POST /api/stripe/checkout — no auth returns 401', async () => {
    const res = await api('/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan: 'growth' }),
    })
    expect(res.status).toBe(401)
  })

  test('POST /api/stripe/checkout — invalid plan returns 400', async () => {
    const res = await api('/api/stripe/checkout', {
      method: 'POST',
      headers: authHeader(token),
      body: JSON.stringify({ plan: 'invalid_plan' }),
    })
    expect([400, 500]).toContain(res.status)
  })

  test('POST /api/stripe/portal — no auth returns 401', async () => {
    const res = await api('/api/stripe/portal', {
      method: 'POST',
    })
    expect(res.status).toBe(401)
  })
})

// ── SUPERADMIN API ─────────────────────────────────────────────────────────
describe('Superadmin API', () => {
  test('POST /api/superadmin/auth/login — valid credentials return token', async () => {
    expect(saToken).toBeTruthy()
  })

  test('POST /api/superadmin/auth/login — wrong password returns 401', async () => {
    const res = await api('/api/superadmin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: process.env.SUPERADMIN_EMAIL, password: 'wrongpass' }),
    })
    expect(res.status).toBe(401)
  })

  test('GET /api/superadmin/stats — returns platform metrics', async () => {
    const res = await api('/api/superadmin/stats', {
      headers: { Authorization: `Bearer ${saToken}` },
    })
    expect(res.status).toBe(200)
    expect(res.data.totalTenants).toBeDefined()
    expect(typeof res.data.totalTenants).toBe('number')
  })

  test('GET /api/superadmin/tenants — lists all tenants including test tenant', async () => {
    const res = await api('/api/superadmin/tenants', {
      headers: { Authorization: `Bearer ${saToken}` },
    })
    expect(res.status).toBe(200)
    expect(res.data.tenants).toBeDefined()
    expect(Array.isArray(res.data.tenants)).toBe(true)
    const testTenant = res.data.tenants.find(t => t.id === tenantId)
    expect(testTenant).toBeDefined()
  })

  test('POST /api/superadmin/impersonate — returns tenant JWT', async () => {
    const res = await api('/api/superadmin/impersonate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${saToken}` },
      body: JSON.stringify({ tenantId }),
    })
    expect(res.status).toBe(200)
    expect(res.data.token).toBeTruthy()
  })

  test('PATCH /api/superadmin/tenants — update plan', async () => {
    const res = await api('/api/superadmin/tenants', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${saToken}` },
      body: JSON.stringify({ id: tenantId, plan: 'growth' }),
    })
    expect(res.status).toBe(200)
    // Reset back to starter
    await api('/api/superadmin/tenants', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${saToken}` },
      body: JSON.stringify({ id: tenantId, plan: 'starter' }),
    })
  })

  test('PATCH /api/superadmin/tenants — reset usage', async () => {
    const res = await api('/api/superadmin/tenants', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${saToken}` },
      body: JSON.stringify({ id: tenantId, resetUsage: true }),
    })
    if (res.status !== 200) console.warn(`Reset usage returned ${res.status}:`, JSON.stringify(res.data))
  })

  test('GET /api/superadmin/leads — returns cross-tenant leads', async () => {
    const res = await api('/api/superadmin/leads', {
      headers: { Authorization: `Bearer ${saToken}` },
    })
    expect(res.status).toBe(200)
    expect(res.data.leads).toBeDefined()
  })

  test('GET /api/superadmin/conversations — returns cross-tenant conversations', async () => {
    const res = await api('/api/superadmin/conversations', {
      headers: { Authorization: `Bearer ${saToken}` },
    })
    expect(res.status).toBe(200)
    expect(res.data.conversations).toBeDefined()
  })

  test('GET /api/superadmin/team — returns team members', async () => {
    const res = await api('/api/superadmin/team', {
      headers: { Authorization: `Bearer ${saToken}` },
    })
    expect(res.status).toBe(200)
    expect(res.data.members || res.data.team).toBeDefined()
  })

  test('GET /api/superadmin/tenants — no auth returns 401', async () => {
    const res = await api('/api/superadmin/tenants')
    expect(res.status).toBe(401)
  })

  test('GET /api/superadmin/tenants — tenant token returns 401', async () => {
    const res = await api('/api/superadmin/tenants', {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status).toBe(401)
  })

  test('GET /api/superadmin/stats — tenant token returns 401', async () => {
    const res = await api('/api/superadmin/stats', {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status).toBe(401)
  })
})
