export async function fireZapierWebhook({ webhookUrl, lead, company, summary, conversationId }) {
  if (!webhookUrl?.trim()) return null
  try {
    const res = await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: lead.name, email: lead.email, type: lead.type,
        summary: summary || '', company, conversationId: conversationId || '',
        timestamp: new Date().toISOString(), source: 'Kaali AI Chat',
      }),
      signal: AbortSignal.timeout(10000),
    })
    console.log(`[Zapier] Fired for ${lead.email} — status ${res.status}`)
    return { success: true }
  } catch (err) {
    console.error('[Zapier] Error:', err.message)
    return null
  }
}
