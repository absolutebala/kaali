import { NextResponse }                  from 'next/server'
import { supabaseAdmin }                 from '@/lib/supabase'
import { callAI, extractLead }           from '@/lib/ai'
import { sendUsageAlert, sendLeadAlert } from '@/lib/email'
import { pushLeadToHubSpot }             from '@/lib/hubspot'
import { fireZapierWebhook }           from '@/lib/zapier'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { tenantId, conversationId, messages, visitorType, pageUrl, visitorData } = body

    if (!tenantId || !messages?.length) {
      return NextResponse.json({ error: 'tenantId and messages are required.' }, { status: 400 })
    }

    // ── Load tenant ───────────────────────────────────────────
    const { data: tenant, error: tErr } = await supabaseAdmin
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single()

    if (tErr || !tenant) {
      return NextResponse.json({ error: 'Workspace not found.' }, { status: 404 })
    }

    // ── Check usage limit ─────────────────────────────────────
    if (tenant.conversations_used >= tenant.conversations_limit) {
      return NextResponse.json({
        text: "I'm currently unavailable. Please contact us directly — we'll be happy to help.",
        limitReached: true,
      })
    }

    // ── Load services + documents ─────────────────────────────
    const [{ data: services }, { data: documents }] = await Promise.all([
      supabaseAdmin.from('services').select('name, description').eq('tenant_id', tenantId).order('sort_order'),
      supabaseAdmin.from('documents').select('name, extracted_text').eq('tenant_id', tenantId),
    ])

    // ── Create conversation if new ────────────────────────────
    let convoId = conversationId
    if (!convoId) {
      const { data: convo } = await supabaseAdmin
        .from('conversations')
        .insert({ tenant_id: tenantId, visitor_type: visitorType || 'GENERAL', page_url: pageUrl || '' })
        .select('id')
        .single()
      convoId = convo?.id
    }

    // ── Store user message ────────────────────────────────────
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
    if (lastUserMsg && convoId) {
      await supabaseAdmin.from('messages').insert({
        conversation_id: convoId,
        tenant_id:       tenantId,
        role:            'user',
        content:         lastUserMsg.content,
      })
    }

    // ── Call AI ───────────────────────────────────────────────
    const { text: rawText, error: aiError } = await callAI({
      tenant, messages,
      services:  services  || [],
      documents: documents || [],
    })

    if (aiError) {
      return NextResponse.json({
        text: "I'm having a small issue right now. Please try again in a moment.",
      })
    }

    // ── Extract lead signal ───────────────────────────────────
    const { lead, cleanText } = extractLead(rawText)

    // ── Store assistant message ───────────────────────────────
    if (convoId) {
      await supabaseAdmin.from('messages').insert({
        conversation_id: convoId,
        tenant_id:       tenantId,
        role:            'assistant',
        content:         cleanText,
      })
    }

    // ── Persist lead + fire integrations ─────────────────────
    let leadSaved = null
    if (lead?.email) {
      const userMsgs = messages.filter(m => m.role === 'user' && !m.content.startsWith('[Visitor'))
      const summary  = (userMsgs[0]?.content || '').substring(0, 120)

      const { data: saved } = await supabaseAdmin
        .from('leads')
        .insert({
          tenant_id:       tenantId,
          conversation_id: convoId,
          name:            lead.name,
          email:           lead.email,
          visitor_type:    lead.type || visitorType || 'GENERAL',
          summary,
          status:          'new',
          company:         lead.company             || '',
          designation:     lead.designation         || '',
          country:         visitorData?.country      || '',
          city:            visitorData?.city         || '',
          device:          visitorData?.device       || '',
          pages_visited:   visitorData?.pagesVisited || [],
          session_count:   visitorData?.sessionCount || 1,
          ip_address:      visitorData?.ip           || '',
        })
        .select('id, name, email, visitor_type')
        .single()

      if (convoId) {
        await supabaseAdmin
          .from('conversations')
          .update({ lead_captured: true, visitor_type: lead.type || visitorType })
          .eq('id', convoId)
      }

      leadSaved = saved

      // Fire integrations in parallel, non-blocking
      const integrations = []

      // Email notification to tenant
      if (tenant.alert_email) {
        integrations.push(
          sendLeadAlert({
            to:          tenant.alert_email,
            companyName: tenant.company,
            lead:        { name: lead.name, email: lead.email, type: lead.type },
            summary,
          }).catch(e => console.error('[Lead email]', e.message))
        )
      }

      // HubSpot push
      integrations.push(
        pushLeadToHubSpot({
          name:    lead.name,
          email:   lead.email,
          type:    lead.type,
          company: tenant.company,
          summary,
        }).catch(e => console.error('[HubSpot]', e.message))
      )

      // Fire all integrations without blocking the response
      Promise.allSettled(integrations)
    }

    // ── Track usage + alert threshold ─────────────────────────
    const newUsed  = tenant.conversations_used + 1
    const pct      = Math.round(newUsed / tenant.conversations_limit * 100)
    const hitAlert = pct >= tenant.alert_threshold && !tenant.alert_sent

    await supabaseAdmin
      .from('tenants')
      .update({ conversations_used: newUsed, ...(hitAlert ? { alert_sent: true } : {}) })
      .eq('id', tenantId)

    if (hitAlert && tenant.alert_email) {
      sendUsageAlert({
        to: tenant.alert_email, companyName: tenant.company,
        pct, used: newUsed, limit: tenant.conversations_limit,
      }).catch(e => console.error('[Usage email]', e.message))
    }

    return NextResponse.json({
      text:           cleanText,
      conversationId: convoId,
      leadCaptured:   !!leadSaved,
      lead:           leadSaved ? { name: leadSaved.name, email: leadSaved.email } : null,
      usagePct:       pct,
    })

  } catch (err) {
    console.error('[Chat] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
