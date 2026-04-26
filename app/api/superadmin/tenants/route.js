import { NextResponse }       from 'next/server'
import { supabaseAdmin }     from '@/lib/supabase'
import { requireSuperAdmin } from '@/lib/superadmin-auth'

export async function OPTIONS() { return new NextResponse(null, { status: 204 }) }

export async function GET(request) {
  const { admin, error } = await requireSuperAdmin(request)
  if (error) return error

  const { searchParams } = new URL(request.url)
  const page   = parseInt(searchParams.get('page')  || '1')
  const limit  = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''
  const plan   = searchParams.get('plan')   || ''

  let query = supabaseAdmin
    .from('tenants')
    .select('id, name, company, email, plan, bot_name, ai_provider, conversations_used, conversations_limit, created_at, alert_email', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (search) query = query.or(`company.ilike.%${search}%,email.ilike.%${search}%,name.ilike.%${search}%`)
  if (plan)   query = query.eq('plan', plan)

  const { data, count, error: dbErr } = await query
  if (dbErr) return NextResponse.json({ error: 'Failed to fetch tenants.' }, { status: 500 })
  return NextResponse.json({ tenants: data || [], total: count || 0, page, limit })
}

export async function PATCH(request) {
  const { admin, error } = await requireSuperAdmin(request, ['superadmin', 'billing'])
  if (error) return error

  const { id, plan, conversationsLimit, resetUsage } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required.' }, { status: 400 })

  const planLimits = { starter: 100, growth: 2000, business: 999999 }
  const updates = {}
  if (plan !== undefined) { updates.plan = plan; updates.conversations_limit = planLimits[plan] || 100 }
  if (conversationsLimit !== undefined) updates.conversations_limit = conversationsLimit
  if (resetUsage) { updates.conversations_used = 0; updates.alert_sent = false }

  const { data, error: dbErr } = await supabaseAdmin.from('tenants').update(updates).eq('id', id).select('id, company, plan, conversations_limit').single()
  if (dbErr) return NextResponse.json({ error: 'Update failed.' }, { status: 500 })
  return NextResponse.json({ tenant: data })
}

export async function DELETE(request) {
  const { admin, error } = await requireSuperAdmin(request, ['superadmin'])
  if (error) return error

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required.' }, { status: 400 })

  await supabaseAdmin.from('tenants').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
