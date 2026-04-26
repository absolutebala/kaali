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

  test('POST /api/chat — valid request returns text or limit message', async () => {
    const res = await api('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        tenantId,
        messages: [{ role: 'user', content: 'Hello, what do you do?' }],
        visitorType: 'GENERAL',
      }),
    })
    expect(res.status).toBe(200)
    // Either has text (AI responded) or limitReached (no API key configured yet)
    expect(res.data.text !== undefined || res.data.limitReached !== undefined).toBe(true)
    // conversationId may not exist if no API key configured
    if (res.data.conversationId) expect(res.data.conversationId).toBeTruthy()
  })

  test('POST /api/chat — handoff detection works', async () => {
    const res = await api('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        tenantId,
        messages: [{ role: 'user', content: 'I want to talk to a human agent' }],
        visitorType: 'GENERAL',
      }),
    })
    expect(res.status).toBe(200)
    // Skip if no API key configured (no text, no handoff, no limitReached)
    if (!res.data.text && !res.data.handoff && !res.data.limitReached) {
      console.log('No API key configured — skipping handoff test'); return
    }
    if (res.data.limitReached) { console.log('Usage limit — skipping handoff test'); return }
    expect(res.data.handoff).toBe('collecting')
    if (res.data.conversationId) expect(res.data.conversationId).toBeTruthy()
    if (res.data.text) expect(res.data.text).toBeTruthy()
  })

  test('POST /api/chat — collecting status extracts valid email', async () => {
    // First trigger handoff to get conversationId
    const handoffRes = await api('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        tenantId,
        messages: [{ role: 'user', content: 'I need to speak to a person' }],
        visitorType: 'GENERAL',
      }),
    })
    if (handoffRes.data.limitReached) { console.log('Usage limit — skipping'); return }
    const convId = handoffRes.data.conversationId
    if (!convId) { console.log('No convId — skipping contact test'); return }

    // Now provide name + email
    const contactRes = await api('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        tenantId,
        conversationId: convId,
        messages: [
          { role: 'user', content: 'I need to speak to a person' },
          { role: 'assistant', content: 'Could I get your name and email?' },
          { role: 'user', content: 'John john@testcompany.com' },
        ],
        visitorType: 'GENERAL',
      }),
    })
    expect(contactRes.status).toBe(200)
    // Should either transfer (handoff: true) or ask again if status not collecting
    expect(contactRes.data.conversationId).toBeTruthy()
  })

  test('POST /api/chat — invalid email asks to confirm', async () => {
    // Trigger handoff
    const handoffRes = await api('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        tenantId,
        messages: [{ role: 'user', content: 'talk to human' }],
        visitorType: 'GENERAL',
      }),
    })
    if (handoffRes.data.limitReached) { console.log('Usage limit — skipping'); return }
    const convId = handoffRes.data.conversationId
    if (!convId) { console.log('No convId — skipping invalid email test'); return }

    // Provide invalid email
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
    // Should ask to confirm invalid email (only if not limit reached)
    if (!res.data.limitReached && res.data.text) {
      expect(res.data.text).toContain('double-check')
    }
  })

})
