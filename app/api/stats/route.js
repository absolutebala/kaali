import { NextResponse }  from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth }   from '@/lib/auth'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

// ── GET /api/stats — dashboard overview numbers ───────────
export async function GET(request) {
  const { tenant, error } = await requireAuth(request)
  if (error) return error

  const tid = tenant.tenantId

  // Run all queries in parallel
  const [
    { count: totalConvos },
    { count: totalLeads  },
    { count: clientLeads },
    { count: weekConvos  },
    { data:  tenantData  },
  ] = await Promise.all([
    supabaseAdmin.from('conversations').select('*', { count:'exact', head:true }).eq('tenant_id', tid),
    supabaseAdmin.from('leads').select('*', { count:'exact', head:true }).eq('tenant_id', tid),
    supabaseAdmin.from('leads').select('*', { count:'exact', head:true }).eq('tenant_id', tid).eq('visitor_type','CLIENT'),
    supabaseAdmin.from('conversations').select('*', { count:'exact', head:true })
      .eq('tenant_id', tid)
      .gte('started_at', new Date(Date.now() - 7 * 86400000).toISOString()),
    supabaseAdmin.from('tenants').select('conversations_used, conversations_limit, plan').eq('id', tid).single(),
  ])

  const used  = tenantData?.conversations_used  || 0
  const limit = tenantData?.conversations_limit || 100
  const pct   = limit > 0 ? Math.min(Math.round(used / limit * 100), 100) : 0

  return NextResponse.json({
    totalConversations: totalConvos  || 0,
    totalLeads:         totalLeads   || 0,
    clientLeads:        clientLeads  || 0,
    weekConversations:  weekConvos   || 0,
    usagePct:           pct,
    used,
    limit,
    plan: tenantData?.plan || 'starter',
  })
}
