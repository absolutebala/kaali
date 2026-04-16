import { NextResponse }       from 'next/server'
import { supabaseAdmin }     from '@/lib/supabase'
import { requireSuperAdmin } from '@/lib/superadmin-auth'

export async function OPTIONS() { return new NextResponse(null, { status: 204 }) }

export async function GET(request) {
  const { admin, error } = await requireSuperAdmin(request)
  if (error) return error

  const [
    { count: totalTenants },
    { count: totalLeads },
    { count: totalConvos },
    { data: allTenants },
    { data: recentTenants },
    { count: weekTenants },
  ] = await Promise.all([
    supabaseAdmin.from('tenants').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('leads').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('conversations').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('tenants').select('plan'),
    supabaseAdmin.from('tenants').select('id, name, company, email, plan, created_at').order('created_at', { ascending: false }).limit(5),
    supabaseAdmin.from('tenants').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7*86400000).toISOString()),
  ])

  const planBreakdown = (allTenants||[]).reduce((acc, t) => { acc[t.plan]=(acc[t.plan]||0)+1; return acc }, {})

  return NextResponse.json({
    totalTenants:  totalTenants  || 0,
    totalLeads:    totalLeads    || 0,
    totalConvos:   totalConvos   || 0,
    weekTenants:   weekTenants   || 0,
    planBreakdown,
    recentTenants: recentTenants || [],
  })
}
