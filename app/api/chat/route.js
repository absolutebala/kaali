import { NextResponse }                  from 'next/server'
import { supabaseAdmin }                 from '@/lib/supabase'
import { callAI, extractLead }           from '@/lib/ai'
import { sendUsageAlert, sendLeadAlert, sendHandoffAlert } from '@/lib/email'
import { pushLeadToHubSpot }             from '@/lib/hubspot'
import { pushLeadToZoho }              from '@/lib/zoho'
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

    // ── Define lastUserMsg early ─────────────────────────────
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')

    // ── Check if conversation is in live agent mode ──────────
    if (conversationId) {
      const { data: activeConvo } = await supabaseAdmin
        .from('conversations').select('status').eq('id', conversationId).single()
      if (activeConvo?.status === 'live') {
        if (lastUserMsg) {
          await supabaseAdmin.from('messages').insert({ conversation_id: conversationId, role: 'user', content: lastUserMsg.content })
        }
        return NextResponse.json({ text: null, live: true, conversationId })
      }
      // If collecting status - conversation exists, let it proceed normally
      if (activeConvo?.status === 'collecting' || activeConvo?.status === 'waiting') {
        // Continue to AI call so it can extract lead details
      }
    }

    // ── Check online agents for this tenant ──────────────────
    const { data: onlineAgentsList } = await supabaseAdmin
      .from('agent_sessions').select('id')
      .eq('tenant_id', tenantId).eq('is_online', true)
      .gt('last_seen', new Date(Date.now() - 120000).toISOString())
    const agentsOnline = !!(onlineAgentsList && onlineAgentsList.length > 0)

    const [{ data: services }, { data: documents }, { data: trainingPairs }] = await Promise.all([
      supabaseAdmin.from('services').select('name, description').eq('tenant_id', tenantId).order('sort_order'),
      supabaseAdmin.from('documents').select('name, extracted_text').eq('tenant_id', tenantId),
      supabaseAdmin.from('training_pairs').select('question, answer').eq('tenant_id', tenantId),
    ])

    // ── Create conversation if new ────────────────────────────
    let convoId = conversationId
    if (!convoId) {
      const { data: convo } = await supabaseAdmin
        .from('conversations')
        .insert({
          tenant_id:    tenantId,
          visitor_type: visitorType || 'GENERAL',
          page_url:     pageUrl     || '',
          country:      visitorData?.country      || '',
          city:         visitorData?.city         || '',
          device:       visitorData?.device       || '',
          pages_visited:visitorData?.pagesVisited || [],
          org:          (visitorData?.org         || '').replace(/^AS\d+\s+/,''),
          browser:      visitorData?.browser      || '',
          os:           visitorData?.os           || '',
          referrer:     visitorData?.referrer     || '',
          timezone:     visitorData?.timezone     || '',
        })
        .select('id')
        .single()
      convoId = convo?.id
    }

    // ── Store user message ────────────────────────────────────
    if (lastUserMsg && convoId) {
      await supabaseAdmin.from('messages').insert({
        conversation_id: convoId,
        tenant_id:       tenantId,
        role:            'user',
        content:         lastUserMsg.content,
      })
    }

    // ── Pre-check for handoff request (before calling AI) ─────
    const handoffRx = /talk to.*(human|person|agent|team|someone)|speak with.*(team|someone|human|person)|real person|live (agent|chat|support|help)|connect me to.*team|human support|human agent|speak to a person|want.*human|want.*agent|want.*real person/i
    const lastMsg = messages.filter(m => m.role === 'user').pop()?.content || ''

    // Check if previous bot message was asking for contact during handoff
    const prevMsgs = messages.slice(-4)
    const botAskedForContact = prevMsgs.some(m => m.role === 'assistant' && (m.content.includes('name and email') || m.content.includes('get your name')))
    const alreadyInHandoff = conversationId && botAskedForContact

    if (handoffRx.test(lastMsg) && !alreadyInHandoff) {
      // Step 1: Ask for contact details first
      let handoffConvoId = conversationId
      if (!handoffConvoId) {
        const { data: newConvo } = await supabaseAdmin.from('conversations').insert({
          tenant_id: tenantId, visitor_type: visitorType || 'GENERAL', page_url: pageUrl || '',
          country: visitorData?.country||'', city: visitorData?.city||'', device: visitorData?.device||'',
          org: (visitorData?.org||'').replace(/^AS\d+\s+/,''), status: 'collecting',
          handoff_at: new Date().toISOString(), handoff_msg: lastMsg,
        }).select('id').single()
        handoffConvoId = newConvo?.id
      } else {
        await supabaseAdmin.from('conversations').update({
          status: 'collecting', handoff_at: new Date().toISOString(), handoff_msg: lastMsg,
        }).eq('id', handoffConvoId)
      }
      if (handoffConvoId && lastMsg) {
        await supabaseAdmin.from('messages').insert({ conversation_id: handoffConvoId, role: 'user', content: lastMsg })
      }
      const botReply = "Of course! Before I connect you, could I get your name and email address? That way our team member will know who they're speaking with. 😊"
      if (handoffConvoId) {
        await supabaseAdmin.from('messages').insert({ conversation_id: handoffConvoId, role: 'assistant', content: botReply })
      }
      return NextResponse.json({ text: botReply, conversationId: handoffConvoId, handoff: 'collecting' })
    }

    // Check if we're collecting contact for handoff and now have name+email
    if (alreadyInHandoff && conversationId) {
      const { data: convoStatus } = await supabaseAdmin.from('conversations')
        .select('status').eq('id', conversationId).single()

      if (convoStatus?.status === 'collecting') {
        // Let AI handle extracting the name/email, then we'll fire the handoff
        // after lead is captured (handled below in lead capture flow)
        // Just mark conversation as waiting now
        await supabaseAdmin.from('conversations').update({ status: 'waiting' }).eq('id', conversationId)
      }
    }


    // ── Call AI ───────────────────────────────────────────────
    const { text: rawText, error: aiError } = await callAI({
      tenant, messages,
      services:      services      || [],
      documents:     documents     || [],
      trainingPairs: trainingPairs || [],
      agentsOnline,
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
          org:             (visitorData?.org         || '').replace(/^AS\d+\s+/,''),
          browser:         visitorData?.browser      || '',
          os:              visitorData?.os           || '',
          referrer:        visitorData?.referrer     || '',
          timezone:        visitorData?.timezone     || '',
          language:        visitorData?.language     || '',
          screen_width:    visitorData?.screenWidth  || 0,
          utm_source:      visitorData?.utmSource    || '',
          utm_campaign:    visitorData?.utmCampaign  || '',
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

      // If this was a handoff collection, update status and notify agents
      if (convoId) {
        const { data: convoCheck } = await supabaseAdmin.from('conversations')
          .select('status').eq('id', convoId).single()
        if (convoCheck?.status === 'collecting' || convoCheck?.status === 'waiting') {
          await supabaseAdmin.from('conversations').update({ status: 'waiting' }).eq('id', convoId)
          const { data: onlineAgents } = await supabaseAdmin.from('agent_sessions')
            .select('id').eq('tenant_id', tenantId).eq('is_online', true)
            .gt('last_seen', new Date(Date.now() - 120000).toISOString())
          if (tenant.alert_email) {
            sendHandoffAlert({ to: tenant.alert_email, companyName: tenant.company, visitorType, pageUrl, conversationId: convoId })
              .catch(e => console.error('[Handoff email]', e.message))
          }
          const agentsOnline = !!(onlineAgents && onlineAgents.length > 0)
          const transferReply = agentsOnline
            ? `Thanks ${leadSaved.name}! Connecting you to our team now... 🔄 A team member will be with you shortly.`
            : `Thanks ${leadSaved.name}! I've alerted our team and they'll follow up with you soon at ${leadSaved.email}.`
          await supabaseAdmin.from('messages').insert({ conversation_id: convoId, role: 'assistant', content: transferReply })
          return NextResponse.json({ text: transferReply, conversationId: convoId, handoff: true, agentsOnline })
        }
      }

      // Fire integrations in parallel, non-blocking
      const integrations = []

      // Email notification to tenant
      if (tenant.alert_email) {
        integrations.push(
          sendLeadAlert({
            to:          tenant.alert_email,
            companyName: tenant.company,
            lead:        { name: lead.name, email: lead.email, type: lead.type, company: lead.company||'', designation: lead.designation||'' },
            summary,
            visitorData,
          }).catch(e => console.error('[Lead email]', e.message))
        )
      }

      // HubSpot push
      if (tenant.hubspot_token) {
        integrations.push(
          pushLeadToHubSpot({
            token:   tenant.hubspot_token,
            name:    lead.name,
            email:   lead.email,
            type:    lead.type,
            company: lead.company || tenant.company,
            summary,
          }).catch(e => console.error('[HubSpot]', e.message))
        )
      }

      // Zoho CRM push
      if (tenant.zoho_token) {
        integrations.push(
          pushLeadToZoho({
            token:       tenant.zoho_token,
            name:        lead.name,
            email:       lead.email,
            type:        lead.type,
            company:     lead.company     || '',
            designation: lead.designation || '',
            summary,
          }).catch(e => console.error('[Zoho]', e.message))
        )
      }

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
