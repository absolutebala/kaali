import { NextResponse }  from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth }   from '@/lib/auth'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

// ── GET /api/leads — list leads with optional filter ──────
export async function GET(request) {
  const { tenant, error } = await requireAuth(request)
  if (error) return error

  const { searchParams } = new URL(request.url)
  const type   = searchParams.get('type')   // CLIENT | INVESTOR | EXISTING | GENERAL
  const status = searchParams.get('status') // new | contacted | converted
  const page   = parseInt(searchParams.get('page') || '1')
  const limit  = parseInt(searchParams.get('limit') || '50')

  let query = supabaseAdmin
    .from('leads')
    .select('id, name, email, visitor_type, summary, status, conversation_id, created_at', { count: 'exact' })
    .eq('tenant_id', tenant.tenantId)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (type)   query = query.eq('visitor_type', type.toUpperCase())
  if (status) query = query.eq('status', status)

  const { data, count, error: dbErr } = await query
  if (dbErr) return NextResponse.json({ error: 'Failed to fetch leads.' }, { status: 500 })

  return NextResponse.json({ leads: data || [], total: count || 0, page, limit })
}

// ── PATCH /api/leads — update status ──────────────────────
// Body: { id, status }
export async function PATCH(request) {
  const { tenant, error } = await requireAuth(request)
  if (error) return error

  const { id, status } = await request.json()
  if (!id || !status) return NextResponse.json({ error: 'id and status are required.' }, { status: 400 })

  const valid = ['new', 'contacted', 'converted']
  if (!valid.includes(status)) {
    return NextResponse.json({ error: `status must be one of: ${valid.join(', ')}` }, { status: 400 })
  }

  const { data, error: dbErr } = await supabaseAdmin
    .from('leads')
    .update({ status })
    .eq('id', id)
    .eq('tenant_id', tenant.tenantId)   // ensure tenant owns this lead
    .select('id, status')
    .single()

  if (dbErr || !data) return NextResponse.json({ error: 'Lead not found or update failed.' }, { status: 404 })
  return NextResponse.json({ lead: data })
}
