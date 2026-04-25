import { NextResponse }  from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth }   from '@/lib/auth'
import { sendHandoffAlert } from '@/lib/email'
import { decryptKey }       from '@/lib/auth'

export async function OPTIONS() { return new NextResponse(null, { status: 204 }) }

// GET — get waiting chats + agent online status
export async function GET(request) {
  const { tenant, error } = await requireAuth(request)
  if (error) return error

  const [{ data: waiting }, { data: live }, { data: agents }] = await Promise.all([
    supabaseAdmin.from('conversations')
      .select('id, visitor_type, started_at, page_url, country, city, device, org, handoff_at, handoff_msg')
      .eq('tenant_id', tenant.tenantId).eq('status', 'waiting')
      .order('handoff_at', { ascending: true }),
    supabaseAdmin.from('conversations')
      .select('id, visitor_type, started_at, page_url, country, city, device, org, handoff_at, agent_id, handoff_msg')
      .eq('tenant_id', tenant.tenantId).eq('status', 'live')
      .order('handoff_at', { ascending: true }),
    supabaseAdmin.from('agent_sessions')
      .select('id, member_id, is_online, last_seen')
      .eq('tenant_id', tenant.tenantId).eq('is_online', true)
      .gt('last_seen', new Date(Date.now() - 90000).toISOString()),
  ])

  return NextResponse.json({ waiting: waiting || [], live: live || [], onlineCount: agents?.length || 0 })
}

// POST — handle agent actions
export async function POST(request) {
  const { tenant, error } = await requireAuth(request)
  if (error) return error

  const { action, conversationId, message } = await request.json()

  // Load tenant data (needed for AI key in accept action)
  const { data: tenantData } = await supabaseAdmin
    .from('tenants').select('ai_provider, ai_model, api_key').eq('id', tenant.tenantId).single()
  if (tenantData) Object.assign(tenant, tenantData)

  if (action === 'heartbeat') {
    const memberId = tenant.memberId || null
    // Check if session exists
    const { data: existing } = await supabaseAdmin.from('agent_sessions')
      .select('id').eq('tenant_id', tenant.tenantId)
      .is(memberId ? 'member_id' : 'member_id', memberId)
      .maybeSingle()

    if (existing) {
      await supabaseAdmin.from('agent_sessions')
        .update({ is_online: true, last_seen: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      await supabaseAdmin.from('agent_sessions')
        .insert({ tenant_id: tenant.tenantId, member_id: memberId, is_online: true, last_seen: new Date().toISOString() })
    }
    return NextResponse.json({ ok: true })
  }

  if (action === 'accept') {
    // Fetch full conversation messages for summary
    const { data: msgs } = await supabaseAdmin
      .from('messages')
      .select('role, content, is_agent')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    // Generate AI summary using tenant's own key
    let summary = ''
    try {
      const transcript = (msgs || [])
        .filter(m => !m.is_agent)
        .map(m => `${m.role === 'user' ? 'Visitor' : 'Bot'}: ${m.content}`)
        .join('
')

      const summaryPrompt = `Summarize this chat conversation in 2-3 sentences for a team member who is about to take over. Focus on: what the visitor wants, any key details they shared, and why they requested a live agent.

Conversation:
${transcript}

Summary:`

      // Call tenant's AI
      const apiKey = tenant.api_key ? decryptKey(tenant.api_key) : null

      if (apiKey && tenant.ai_provider === 'claude') {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: tenant.ai_model || 'claude-haiku-4-5-20251001', max_tokens: 200, messages: [{ role: 'user', content: summaryPrompt }] })
        })
        const d = await res.json()
        summary = d.content?.[0]?.text || ''
      } else if (apiKey && tenant.ai_provider === 'openai') {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ model: tenant.ai_model || 'gpt-4o-mini', max_tokens: 200, messages: [{ role: 'user', content: summaryPrompt }] })
        })
        const d = await res.json()
        summary = d.choices?.[0]?.message?.content || ''
      }
    } catch(e) {
      console.error('[Agent summary]', e.message)
      summary = 'Visitor requested to speak with a team member.'
    }

    // Update conversation status and store summary
    await supabaseAdmin.from('conversations').update({
      status:      'live',
      agent_id:    tenant.memberId || null,
      handoff_msg: summary,
    }).eq('id', conversationId).eq('tenant_id', tenant.tenantId)

    // Send join message to visitor widget only
    await supabaseAdmin.from('messages').insert({
      conversation_id: conversationId,
      tenant_id:       tenant.tenantId,
      role:            'assistant',
      content:         '👋 A team member has joined the chat. How can I help you today?',
      is_agent:        true,
    })

    return NextResponse.json({ ok: true, summary })
  }

  if (action === 'send') {
    if (!message?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 })
    // Verify conversation belongs to this tenant
    const { data: convo } = await supabaseAdmin.from('conversations')
      .select('id').eq('id', conversationId).eq('tenant_id', tenant.tenantId).maybeSingle()
    if (!convo) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })

    const { data: msg, error: dbErr } = await supabaseAdmin.from('messages').insert({
      conversation_id: conversationId,
      tenant_id:       tenant.tenantId,
      role:            'assistant',
      content:         message.trim(),
      is_agent:        true,
    }).select('id, role, content, is_agent, created_at').single()
    if (dbErr) {
      console.error('[Agent send]', dbErr)
      return NextResponse.json({ error: dbErr.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, message: msg })
  }

  if (action === 'close') {
    await supabaseAdmin.from('conversations').update({ status: 'closed' })
      .eq('id', conversationId).eq('tenant_id', tenant.tenantId)
    return NextResponse.json({ ok: true })
  }

  if (action === 'offline') {
    await supabaseAdmin.from('agent_sessions').update({ is_online: false })
      .eq('tenant_id', tenant.tenantId).eq('member_id', tenant.memberId || null)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
