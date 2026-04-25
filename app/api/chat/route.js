import { NextResponse }                  from 'next/server'
import { supabaseAdmin }                 from '@/lib/supabase'
import { callAI, extractLead }           from '@/lib/ai'
import { sendUsageAlert, sendLeadAlert, sendHandoffAlert } from '@/lib/email'
import { pushLeadToHubSpot }             from '@/lib/hubspot'
import { pushLeadToZoho }               from '@/lib/zoho'
import { fireZapierWebhook }            from '@/lib/zapier'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

function extractContact(text) {
  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/)
  if (!emailMatch) return null
  const email = emailMatch[0]
  const before = text.substring(0, text.indexOf(email)).replace(/[,\s]+$/, '').trim()
  const nameParts = before.split(/\s+/).filter(Boolean)
  const name = nameParts.slice(-3).join(' ') || 'Visitor'
  return { name, email }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { tenantId, conversationId, messages, visitorType, pageUrl, visitorData } = body

    if (!tenantId || !messages?.length) {
      return NextResponse.json({ error: 'tenantId and messages are required.' }, { status: 400 })
    }

    const { data: tenant, error: tErr } = await supabaseAdmin
      .from('tenants').select('*').eq('id', tenantId).single()
    if (tErr || !tenant) return NextResponse.json({ error: 'Workspace not found.' }, { status: 404 })

    if (tenant.conversations_used >= tenant.conversations_limit) {
      return NextResponse.json({ text: "I'm currently unavailable. Please contact us directly.", limitReached: true })
    }

    const lastMsg = [...messages].reverse().find(m => m.role === 'user')?.content || ''

    // ── LIVE MODE: agent handling ─────────────────────────────
    if (conversationId) {
      const { data: convo } = await supabaseAdmin
        .from('conversations').select('status').eq('id', conversationId).single()

      if (convo?.status === 'live') {
        await supabaseAdmin.from('messages').insert({ conversation_id: conversationId, tenant_id: tenantId, role: 'user', content: lastMsg })
        return NextResponse.json({ text: null, live: true, conversationId })
      }

      // ── COLLECTING: extract contact directly ─────────────────
      if (convo?.status === 'collecting') {
        const contact = extractContact(lastMsg)
        if (contact) {
          const summary = messages.filter(m => m.role === 'user').map(m => m.content).join(' ').substring(0, 120)

          await supabaseAdmin.from('messages').insert({ conversation_id: conversationId,
            tenant_id: tenantId, role: 'user', content: lastMsg })

          await supabaseAdmin.from('leads').insert({
            tenant_id: tenantId, conversation_id: conversationId,
            name: contact.name, email: contact.email,
            visitor_type: visitorType || 'GENERAL', summary, status: 'new',
            country: visitorData?.country||'', city: visitorData?.city||'',
            device: visitorData?.device||'', ip_address: visitorData?.ip||'',
            org: (visitorData?.org||'').replace(/^AS\d+\s+/,''),
            browser: visitorData?.browser||'', os: visitorData?.os||'',
          })

          await supabaseAdmin.from('conversations').update({ status: 'waiting', lead_captured: true }).eq('id', conversationId)

          const { data: agents } = await supabaseAdmin.from('agent_sessions')
            .select('id').eq('tenant_id', tenantId).eq('is_online', true)
            .gt('last_seen', new Date(Date.now() - 120000).toISOString())
          const agentsOnline = !!(agents?.length)

          if (tenant.alert_email) {
            sendHandoffAlert({ to: tenant.alert_email, companyName: tenant.company, visitorType, pageUrl, conversationId }).catch(() => {})
          }

          const reply = agentsOnline
            ? `Thanks ${contact.name}! Connecting you to our team now... 🔄 A team member will be with you shortly.`
            : `Thanks ${contact.name}! I've alerted our team and they'll follow up with you at ${contact.email} soon.`

          await supabaseAdmin.from('messages').insert({ conversation_id: conversationId,
            tenant_id: tenantId, role: 'assistant', content: reply })
          return NextResponse.json({ text: reply, conversationId, handoff: true, agentsOnline })
        }
        // No email yet — fall through to AI to ask again naturally
      }
    }

    // ── AGENT ONLINE STATUS ───────────────────────────────────
    const { data: onlineAgentsList } = await supabaseAdmin.from('agent_sessions')
      .select('id').eq('tenant_id', tenantId).eq('is_online', true)
      .gt('last_seen', new Date(Date.now() - 120000).toISOString())
    const agentsOnline = !!(onlineAgentsList?.length)

    // ── LOAD KB ───────────────────────────────────────────────
    const [{ data: services }, { data: documents }, { data: trainingPairs }] = await Promise.all([
      supabaseAdmin.from('services').select('name, description').eq('tenant_id', tenantId).order('sort_order'),
      supabaseAdmin.from('documents').select('name, extracted_text').eq('tenant_id', tenantId),
      supabaseAdmin.from('training_pairs').select('question, answer').eq('tenant_id', tenantId),
    ])

    // ── CREATE/REUSE CONVERSATION ─────────────────────────────
    let convoId = conversationId
    if (!convoId) {
      const { data: convo } = await supabaseAdmin.from('conversations').insert({
        tenant_id: tenantId, visitor_type: visitorType || 'GENERAL', page_url: pageUrl || '',
        country: visitorData?.country||'', city: visitorData?.city||'', device: visitorData?.device||'',
        pages_visited: visitorData?.pagesVisited||[], org: (visitorData?.org||'').replace(/^AS\d+\s+/,''),
        browser: visitorData?.browser||'', os: visitorData?.os||'', referrer: visitorData?.referrer||'',
        timezone: visitorData?.timezone||'',
      }).select('id').single()
      convoId = convo?.id
    }

    if (lastMsg && convoId) {
      await supabaseAdmin.from('messages').insert({ conversation_id: convoId,
            tenant_id: tenantId, role: 'user', content: lastMsg })
    }

    // ── HANDOFF DETECTION ─────────────────────────────────────
    const handoffRx = /talk to.*(human|person|agent|team|someone)|speak with.*(team|someone|human|person)|real person|live (agent|chat|support|help)|connect me to.*team|human support|human agent|speak to a person|want.*human|want.*agent|want.*real person|need.*human|need.*agent/i
    const botAlreadyAsked = messages.some(m => m.role === 'assistant' && m.content.includes('name and email'))

    if (handoffRx.test(lastMsg) && !botAlreadyAsked) {
      await supabaseAdmin.from('conversations').update({
        status: 'collecting', handoff_at: new Date().toISOString(), handoff_msg: lastMsg,
      }).eq('id', convoId)

      const reply = "Of course! Before I connect you, could I get your name and email address? That way our team member will know who they're speaking with. 😊"
      await supabaseAdmin.from('messages').insert({ conversation_id: convoId,
            tenant_id: tenantId, role: 'assistant', content: reply })
      return NextResponse.json({ text: reply, conversationId: convoId, handoff: 'collecting' })
    }

    // ── CALL AI ───────────────────────────────────────────────
    const { text: rawText, error: aiError } = await callAI({
      tenant, messages, services: services||[], documents: documents||[], trainingPairs: trainingPairs||[], agentsOnline,
    })

    if (aiError) return NextResponse.json({ text: "I'm having a small issue right now. Please try again in a moment." })

    const { lead, cleanText } = extractLead(rawText)

    if (convoId) {
      await supabaseAdmin.from('messages').insert({ conversation_id: convoId,
            tenant_id: tenantId, role: 'assistant', content: cleanText })
    }

    // ── LEAD CAPTURE ──────────────────────────────────────────
    let leadSaved = null
    if (lead?.email) {
      const summary = messages.filter(m => m.role === 'user').map(m => m.content).join(' ').substring(0, 120)
      const { data: saved } = await supabaseAdmin.from('leads').insert({
        tenant_id: tenantId, conversation_id: convoId,
        name: lead.name, email: lead.email,
        visitor_type: lead.type || visitorType || 'GENERAL', summary, status: 'new',
        company: lead.company||'', designation: lead.designation||'',
        country: visitorData?.country||'', city: visitorData?.city||'', device: visitorData?.device||'',
        pages_visited: visitorData?.pagesVisited||[], session_count: visitorData?.sessionCount||1,
        ip_address: visitorData?.ip||'', org: (visitorData?.org||'').replace(/^AS\d+\s+/,''),
        browser: visitorData?.browser||'', os: visitorData?.os||'', referrer: visitorData?.referrer||'',
        timezone: visitorData?.timezone||'', language: visitorData?.language||'',
        screen_width: visitorData?.screenWidth||0, utm_source: visitorData?.utmSource||'', utm_campaign: visitorData?.utmCampaign||'',
      }).select('id, name, email, visitor_type').single()

      if (convoId) await supabaseAdmin.from('conversations').update({ lead_captured: true, visitor_type: lead.type || visitorType }).eq('id', convoId)
      leadSaved = saved

      const integrations = []
      if (tenant.alert_email) integrations.push(sendLeadAlert({ to: tenant.alert_email, companyName: tenant.company, lead: { name: lead.name, email: lead.email, type: lead.type, company: lead.company||'', designation: lead.designation||'' }, summary, visitorData }).catch(() => {}))
      if (tenant.hubspot_token) integrations.push(pushLeadToHubSpot({ token: tenant.hubspot_token, name: lead.name, email: lead.email, type: lead.type, company: lead.company||tenant.company, summary }).catch(() => {}))
      if (tenant.zoho_token)    integrations.push(pushLeadToZoho({ token: tenant.zoho_token, name: lead.name, email: lead.email, type: lead.type, company: lead.company||'', designation: lead.designation||'', summary }).catch(() => {}))
      if (tenant.zapier_webhook_url) integrations.push(fireZapierWebhook({ url: tenant.zapier_webhook_url, name: lead.name, email: lead.email, type: lead.type, company: lead.company||'', summary, timestamp: new Date().toISOString() }).catch(() => {}))
      Promise.allSettled(integrations)
    }

    // ── USAGE TRACKING ────────────────────────────────────────
    const newUsed  = tenant.conversations_used + 1
    const pct      = Math.round(newUsed / tenant.conversations_limit * 100)
    const hitAlert = pct >= tenant.alert_threshold && !tenant.alert_sent
    await supabaseAdmin.from('tenants').update({ conversations_used: newUsed, ...(hitAlert ? { alert_sent: true } : {}) }).eq('id', tenantId)
    if (hitAlert && tenant.alert_email) sendUsageAlert({ to: tenant.alert_email, companyName: tenant.company, pct, used: newUsed, limit: tenant.conversations_limit }).catch(() => {})

    return NextResponse.json({ text: cleanText, conversationId: convoId, leadCaptured: !!leadSaved, lead: leadSaved ? { name: leadSaved.name, email: leadSaved.email } : null, usagePct: pct })

  } catch (err) {
    console.error('[Chat] Error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
