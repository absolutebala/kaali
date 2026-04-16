import { NextResponse }       from 'next/server'
import { supabaseAdmin }     from '@/lib/supabase'
import { requireSuperAdmin } from '@/lib/superadmin-auth'

export async function OPTIONS() { return new NextResponse(null, { status: 204 }) }

export async function GET(request) {
  const { admin, error } = await requireSuperAdmin(request)
  if (error) return error

  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenantId') || ''
  const convoId  = searchParams.get('id') || ''

  if (convoId) {
    const { data: msgs }  = await supabaseAdmin.from('messages').select('id, role, content, created_at').eq('conversation_id', convoId).order('created_at')
    const { data: convo } = await supabaseAdmin.from('conversations').select('id, visitor_type, lead_captured, started_at, tenant_id, tenants(company)').eq('id', convoId).single()
    return NextResponse.json({ conversation: convo, messages: msgs || [] })
  }

  let query = supabaseAdmin
    .from('conversations')
    .select('id, visitor_type, lead_captured, started_at, tenant_id, tenants(company)', { count: 'exact' })
    .order('started_at', { ascending: false })
    .limit(50)

  if (tenantId) query = query.eq('tenant_id', tenantId)
  const { data, count } = await query
  return NextResponse.json({ conversations: data || [], total: count || 0 })
}
