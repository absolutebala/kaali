import { NextResponse }  from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth }   from '@/lib/auth'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

// ── GET /api/conversations ────────────────────────────────
// ?id=<uuid>  → returns messages for that conversation
// (no id)     → returns conversation list
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const convoId = searchParams.get('id')
  const isPublic = searchParams.get('public') === '1'

  // Public endpoint for widget polling - only allows fetching by conversationId
  if (isPublic && convoId) {
    const { data: messages } = await supabaseAdmin
      .from('messages').select('id, role, content, is_agent, created_at')
      .eq('conversation_id', convoId).order('created_at', { ascending: true })
    const { data: convo } = await supabaseAdmin
      .from('conversations').select('status').eq('id', convoId).single()
    return NextResponse.json({ messages: messages || [], conversation: convo || {} })
  }

  const { tenant, error } = await requireAuth(request)
  if (error) return error

  if (convoId) {
    // ── Single conversation messages ──────────────────────
    // Verify tenant owns it
    // Fetch conversation
    const { data: convo, error: convoErr } = await supabaseAdmin
      .from('conversations')
      .select('id, visitor_type, lead_captured, started_at, page_url, country, city, device, pages_visited, org, browser, os, referrer, timezone, is_read, status, handoff_at, handoff_msg, agent_id')
      .eq('id', convoId)
      .eq('tenant_id', tenant.tenantId)
      .single()

    if (!convo || convoErr) return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 })

    // Mark as read
    await supabaseAdmin.from('conversations').update({ is_read: true }).eq('id', convoId).eq('tenant_id', tenant.tenantId)

    // Fetch messages
    const { data: messages } = await supabaseAdmin
      .from('messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', convoId)
      .order('created_at', { ascending: true })

    // Fetch lead separately (optional — won't break if missing)
    const { data: leadData } = await supabaseAdmin
      .from('leads')
      .select('name, email, company, designation, country, city, device, session_count, pages_visited, org, browser, os, language, screen_width, utm_source, utm_campaign, ip_address')
      .eq('conversation_id', convoId)
      .maybeSingle()

    return NextResponse.json({ conversation: { ...convo, lead: leadData || null }, messages: messages || [] })
  }

  // ── Conversation list ─────────────────────────────────────
  const page  = parseInt(searchParams.get('page')  || '1')
  const limit = parseInt(searchParams.get('limit') || '30')

  const { data, count } = await supabaseAdmin
    .from('conversations')
    .select('id, visitor_type, lead_captured, started_at, page_url, country, city, device, org, browser, os, referrer, is_read, status, handoff_at', { count: 'exact' })
    .eq('tenant_id', tenant.tenantId)
    .order('started_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  return NextResponse.json({ conversations: data || [], total: count || 0, page, limit })
}
