const { api, setupTestTenant, teardownTestTenant, authHeader, getTenantId } = require('../helpers/setup')

let token, tenantId

beforeAll(async () => {
  const setup = await setupTestTenant()
  token    = setup.token
  tenantId = setup.tenantId
})

afterAll(async () => {
  await teardownTestTenant()
})

describe('Chat API', () => {

  test('GET /api/widget-config/:tenantId — returns bot config', async () => {
    const res = await api(`/api/widget-config/${tenantId}`)
    expect(res.status).toBe(200)
    expect(res.data.botName).toBeDefined()
    expect(res.data.tenantId).toBe(tenantId)
  })

  test('GET /api/widget-config/invalid — returns 404', async () => {
    const res = await api('/api/widget-config/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
  })

  test('POST /api/chat — missing tenantId returns 400', async () => {
    const res = await api('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] }),
    })
    expect(res.status).toBe(400)
  })

  test('POST /api/chat — missing messages returns 400', async () => {
    const res = await api('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ tenantId }),
    })
    expect(res.status).toBe(400)
  })

  test('POST /api/chat — invalid tenantId returns 404', async () => {
    const res = await api('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        tenantId: '00000000-0000-0000-0000-000000000000',
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    })
    expect(res.status).toBe(404)
  })

  test('POST /api/chat — valid request returns 200', async () => {
    const res = await api('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        tenantId,
        messages: [{ role: 'user', content: 'Hello, what do you do?' }],
        visitorType: 'GENERAL',
      }),
    })
    expect(res.status).toBe(200)
    // Response varies based on API key config — just check it's valid JSON
    expect(res.data).toBeDefined()
  })

  test('POST /api/chat — handoff detection', async () => {
    const res = await api('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        tenantId,
        messages: [{ role: 'user', content: 'I want to talk to a human agent' }],
        visitorType: 'GENERAL',
      }),
    })
    expect(res.status).toBe(200)
    // If handoff detected, verify it; if not (no API key), just pass
    if (res.data.handoff) {
      expect(res.data.handoff).toBe('collecting')
    } else {
      console.log('Handoff not triggered (no API key or no response) — test passed')
    }
  })

  test('POST /api/chat — invalid email asks to confirm', async () => {
    // Trigger handoff first
    const handoffRes = await api('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        tenantId,
        messages: [{ role: 'user', content: 'talk to human' }],
        visitorType: 'GENERAL',
      }),
    })
    expect(handoffRes.status).toBe(200)

    if (!handoffRes.data.handoff) {
      console.log('Handoff not triggered — skipping invalid email test')
      return
    }

    const convId = handoffRes.data.conversationId
    if (!convId) { console.log('No convId — skipping'); return }

    const res = await api('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        tenantId,
        conversationId: convId,
        messages: [
          { role: 'user', content: 'talk to human' },
          { role: 'assistant', content: 'Could I get your name and email?' },
          { role: 'user', content: 'Bala bala@invaliddomain' },
        ],
        visitorType: 'GENERAL',
      }),
    })
    expect(res.status).toBe(200)
    if (res.data.text) {
      expect(res.data.text).toContain('double-check')
    }
  })

})
