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
  const { tenant, error } = await requireAuth(request)
  if (error) return error

  const { searchParams } = new URL(request.url)
  const convoId = searchParams.get('id')

  if (convoId) {
    // ── Single conversation messages ──────────────────────
    // Verify tenant owns it
    const { data: convo } = await supabaseAdmin
      .from('conversations')
      .select('id, visitor_type, lead_captured, started_at, page_url, country, city, device, pages_visited, org, browser, os, referrer, timezone, is_read, leads!leads_conversation_id_fkey(country, city, device, session_count, pages_visited, name, email, company, designation, org, browser, os, language, screen_width, utm_source, utm_campaign, ip_address)')
      .eq('id', convoId)
      .eq('tenant_id', tenant.tenantId)
      .single()

    if (!convo) return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 })

    // Mark conversation as read
    await supabaseAdmin.from('conversations').update({ is_read: true }).eq('id', id).eq('tenant_id', tenant.tenantId)

    const { data: messages } = await supabaseAdmin
      .from('messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', convoId)
      .order('created_at', { ascending: true })

    const convoWithLead = { ...convo, lead: convo.leads?.[0] || null }
    delete convoWithLead.leads
    return NextResponse.json({ conversation: convoWithLead, messages: messages || [] })
  }

  // ── Conversation list ─────────────────────────────────────
  const page  = parseInt(searchParams.get('page')  || '1')
  const limit = parseInt(searchParams.get('limit') || '30')

  const { data, count } = await supabaseAdmin
    .from('conversations')
    .select('id, visitor_type, lead_captured, started_at, page_url, country, city, device, org, browser, os, referrer, is_read', { count: 'exact' })
    .eq('tenant_id', tenant.tenantId)
    .order('started_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  return NextResponse.json({ conversations: data || [], total: count || 0, page, limit })
}
