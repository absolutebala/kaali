import { NextResponse }       from 'next/server'
import { supabaseAdmin }     from '@/lib/supabase'
import { requireSuperAdmin } from '@/lib/superadmin-auth'

export async function OPTIONS() { return new NextResponse(null, { status: 204 }) }

export async function GET(request) {
  const { admin, error } = await requireSuperAdmin(request)
  if (error) return error

  const { searchParams } = new URL(request.url)
  const page     = parseInt(searchParams.get('page')  || '1')
  const limit    = parseInt(searchParams.get('limit') || '30')
  const tenantId = searchParams.get('tenantId') || ''

  let query = supabaseAdmin
    .from('leads')
    .select('id, name, email, visitor_type, summary, status, created_at, tenant_id, tenants(company)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (tenantId) query = query.eq('tenant_id', tenantId)
  const { data, count } = await query
  return NextResponse.json({ leads: data || [], total: count || 0 })
}
