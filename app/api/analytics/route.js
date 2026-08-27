import { NextResponse }    from 'next/server'
import { requireAuth }     from '@/lib/auth'
import { supabaseAdmin }   from '@/lib/supabase'

export async function GET(request) {
  const { tenant, error } = await requireAuth(request)
  if (error) return error

  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '30')
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: convos },
    { data: messages },
    { data: leads },
  ] = await Promise.all([
    supabaseAdmin.from('conversations').select('id, started_at, visitor_type, page_url, lead_captured')
      .eq('tenant_id', tenant.tenantId).gte('started_at', since).order('started_at'),
    supabaseAdmin.from('messages').select('id, created_at, role')
      .eq('tenant_id', tenant.tenantId).gte('created_at', since),
    supabaseAdmin.from('leads').select('id, created_at, status, visitor_type')
      .eq('tenant_id', tenant.tenantId).gte('created_at', since),
  ])

  // ── Conversations per day ─────────────────────────────────
  const convsByDay = {}
  const msgsByDay  = {}
  for (let i = 0; i < days; i++) {
    const d   = new Date(Date.now() - (days - 1 - i) * 86400000)
    const key = d.toISOString().slice(0, 10)
    convsByDay[key] = 0
    msgsByDay[key]  = 0
  }

  ;(convos || []).forEach(c => {
    const key = c.started_at?.slice(0, 10)
    if (key && convsByDay[key] !== undefined) convsByDay[key]++
  })

  ;(messages || []).forEach(m => {
    if (m.role !== 'user') return
    const key = m.created_at?.slice(0, 10)
    if (key && msgsByDay[key] !== undefined) msgsByDay[key]++
  })

  // ── Top pages ─────────────────────────────────────────────
  const pageCounts = {}
  ;(convos || []).forEach(c => {
    if (!c.page_url) return
    try {
      const path = new URL(c.page_url).pathname || '/'
      pageCounts[path] = (pageCounts[path] || 0) + 1
    } catch {}
  })
  const topPages = Object.entries(pageCounts)
    .sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([page, count]) => ({ page, count }))

  // ── Visitor type breakdown ────────────────────────────────
  const typeCounts = { CLIENT:0, EXISTING:0, INVESTOR:0, GENERAL:0 }
  ;(convos || []).forEach(c => {
    const t = c.visitor_type || 'GENERAL'
    typeCounts[t] = (typeCounts[t] || 0) + 1
  })

  const totalConvos   = (convos || []).length
  const totalMessages = (messages || []).filter(m => m.role === 'user').length
  const totalLeads    = (leads || []).length
  const conversionRate = totalConvos > 0 ? Math.round((totalLeads / totalConvos) * 100) : 0

  return NextResponse.json({
    days,
    summary: { totalConvos, totalMessages, totalLeads, conversionRate },
    convsByDay: Object.entries(convsByDay).map(([date, count]) => ({ date, count })),
    msgsByDay:  Object.entries(msgsByDay).map(([date, count]) => ({ date, count })),
    topPages,
    typeCounts,
  })
}
