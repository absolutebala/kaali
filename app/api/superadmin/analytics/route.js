import { NextResponse }  from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireSA }     from '@/lib/superadmin-auth'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function GET(request) {
  const { admin, error } = await requireSA(request)
  if (error) return error

  const now     = new Date()
  const day7    = new Date(now - 7  * 86400000).toISOString()
  const day30   = new Date(now - 30 * 86400000).toISOString()

  const [
    { count: totalTenants  },
    { count: newTenants7d  },
    { count: totalLeads    },
    { count: newLeads7d    },
    { count: totalConvos   },
    { count: convos7d      },
    { data:  planBreakdown },
    { data:  recentTenants },
    { data:  topTenants    },
  ] = await Promise.all([
    supabaseAdmin.from('tenants').select('*', { count:'exact', head:true }),
    supabaseAdmin.from('tenants').select('*', { count:'exact', head:true }).gte('created_at', day7),
    supabaseAdmin.from('leads').select('*', { count:'exact', head:true }),
    supabaseAdmin.from('leads').select('*', { count:'exact', head:true }).gte('created_at', day7),
    supabaseAdmin.from('conversations').select('*', { count:'exact', head:true }),
    supabaseAdmin.from('conversations').select('*', { count:'exact', head:true }).gte('started_at', day7),
    supabaseAdmin.from('tenants').select('plan'),
    supabaseAdmin.from('tenants').select('id, name, company, email, plan, created_at').order('created_at', { ascending: false }).limit(5),
    supabaseAdmin.from('tenants').select('id, company, conversations_used, conversations_limit, plan').order('conversations_used', { ascending: false }).limit(5),
  ])

  // Plan breakdown counts
  const plans = { starter: 0, growth: 0, business: 0 }
  planBreakdown?.forEach(t => { if (plans[t.plan] !== undefined) plans[t.plan]++ })

  return NextResponse.json({
    totalTenants:  totalTenants  || 0,
    newTenants7d:  newTenants7d  || 0,
    totalLeads:    totalLeads    || 0,
    newLeads7d:    newLeads7d    || 0,
    totalConvos:   totalConvos   || 0,
    convos7d:      convos7d      || 0,
    planBreakdown: plans,
    recentTenants: recentTenants || [],
    topTenants:    topTenants    || [],
  })
}
