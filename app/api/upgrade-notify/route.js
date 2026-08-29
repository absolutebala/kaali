import { NextResponse }           from 'next/server'
import { requireAuth }            from '@/lib/auth'
import { supabaseAdmin }          from '@/lib/supabase'
import { sendUpgradeNotification } from '@/lib/email'

export async function POST(request) {
  const { tenant, error } = await requireAuth(request)
  if (error) return error

  const { plan } = await request.json()

  // Get tenant stats
  const [
    { count: totalChats },
    { count: totalLeads },
    { data: tenantData },
  ] = await Promise.all([
    supabaseAdmin.from('conversations').select('*', { count:'exact', head:true }).eq('tenant_id', tenant.tenantId),
    supabaseAdmin.from('leads').select('*', { count:'exact', head:true }).eq('tenant_id', tenant.tenantId),
    supabaseAdmin.from('tenants').select('name, email, company, created_at').eq('id', tenant.tenantId).single(),
  ])

  const memberSince = tenantData?.created_at
    ? new Date(tenantData.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
    : 'Unknown'

  await sendUpgradeNotification({
    tenantName:    tenantData?.name    || 'Unknown',
    tenantEmail:   tenantData?.email   || '',
    tenantCompany: tenantData?.company || 'Unknown',
    memberSince,
    totalChats:    totalChats || 0,
    totalLeads:    totalLeads || 0,
    plan:          plan || 'Growth',
  }).catch(e => console.error('[UpgradeNotify]', e.message))

  return NextResponse.json({ ok: true })
}
