import { NextResponse }                  from 'next/server'
import { supabaseAdmin }                 from '@/lib/supabase'
import { callAI, extractLead }           from '@/lib/ai'
import { sendUsageAlert, sendLeadAlert } from '@/lib/email'
import { pushLeadToHubSpot }             from '@/lib/hubspot'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { tenantId, conversationId, messages, visitorType, pageUrl } = body

    if (!tenantId || !messages?.length) {
      return NextResponse.json({ error: 'tenantId and messages are required.' }, { status: 400, headers: CORS })
    }

    const { data: tenant, error: tErr } = await supabaseAdmin
      .from('tenants').select('*').eq('id', tenantId).single()

    if (tErr || !tenant) {
      return NextResponse.json({ error: 'Workspace not found.' }, { status: 404, headers: CORS })
    }

    if (tenant.conversations_used >= tenant.conversations_limit) {
      return NextResponse.json({
        text: "I'm currently unavailable. Please contact us directly.",
        limitReached: true,
      }, { headers: CORS })
    }

    const [{ data: services }, { data: documents }] = await Promise.all([
      supabaseAdmin.from('services').select('name, description').eq('tenant_id', tenantId).order('sort_order'),
      supabaseAdmin.from('documents').select('name, extracted_text').eq('tenant_id', tenantId),
    ])

    let convoId = conversationId
    if (!convoId) {
      const { data: convo } = await supabaseAdmin
        .from('conversations')
        .insert({ tenant_id: tenantId, visitor_type: visitorType || 'GENERAL', page_url: pageUrl || '' })
        .select('id').single()
      convoId = convo?.id
    }

    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
    if (lastUserMsg && convoId) {
      await supabaseAdmin.from('messages').insert({
        conversation_id: convoId, tenant_id: tenantId,
        role: 'user', content: lastUserMsg.content,
      })
    }

    const { text: rawText, error: aiError } = await callAI({
      tenant, messages,
      services:  services  || [],
      documents: documents || [],
    })

    if (aiError) {
      return NextResponse.json({ text: "I'm having a small issue right now. Please try again in a moment." }, { headers: CORS })
    }

    const { lead, cleanText } = extractLead(rawText)

    if (convoId) {
      await supabaseAdmin.from('messages').insert({
        conversation_id: convoId, tenant_id: tenantId,
        role: 'assistant', content: cleanText,
      })
    }

    let leadSaved = null
    if (lead?.email) {
      const userMsgs = messages.filter(m => m.role === 'user' && !m.content.startsWith('[Visitor'))
      const summary  = (userMsgs[0]?.content || '').substring(0, 120)

      const { data: saved } = await supabaseAdmin
        .from('leads')
        .insert({
          tenant_id: tenantId, conversation_id: convoId,
          name: lead.name, email: lead.email,
          visitor_type: lead.type || visitorType || 'GENERAL',
          summary, status: 'new',
        })
        .select('id, name, email, visitor_type').single()

      if (convoId) {
        await supabaseAdmin.from('conversations')
          .update({ lead_captured: true, visitor_type: lead.type || visitorType })
          .eq('id', convoId)
      }

      leadSaved = saved

      Promise.allSettled([
        tenant.alert_email && sendLeadAlert({
          to: tenant.alert_email, companyName: tenant.company,
          lead: { name: lead.name, email: lead.email, type: lead.type },
          summary,
        }),
        pushLeadToHubSpot({
          name: lead.name, email: lead.email,
          type: lead.type, company: tenant.company, summary,
        }),
      ])
    }

    const newUsed  = tenant.conversations_used + 1
    const pct      = Math.round(newUsed / tenant.conversations_limit * 100)
    const hitAlert = pct >= tenant.alert_threshold && !tenant.alert_sent

    await supabaseAdmin.from('tenants')
      .update({ conversations_used: newUsed, ...(hitAlert ? { alert_sent: true } : {}) })
      .eq('id', tenantId)

    if (hitAlert && tenant.alert_email) {
      sendUsageAlert({
        to: tenant.alert_email, companyName: tenant.company,
        pct, used: newUsed, limit: tenant.conversations_limit,
      }).catch(e => console.error('[Usage email]', e.message))
    }

    return NextResponse.json({
      text: cleanText,
      conversationId: convoId,
      leadCaptured: !!leadSaved,
      lead: leadSaved ? { name: leadSaved.name, email: leadSaved.email } : null,
      usagePct: pct,
    }, { headers: CORS })

  } catch (err) {
    console.error('[Chat] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500, headers: CORS })
  }
}
