import { NextResponse }  from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth }   from '@/lib/auth'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

// ── GET /api/services ─────────────────────────────────────
export async function GET(request) {
  const { tenant, error } = await requireAuth(request)
  if (error) return error

  const { data, error: dbErr } = await supabaseAdmin
    .from('services')
    .select('id, name, description, sort_order, created_at')
    .eq('tenant_id', tenant.tenantId)
    .order('sort_order')

  if (dbErr) return NextResponse.json({ error: 'Failed to fetch services.' }, { status: 500 })
  return NextResponse.json({ services: data || [] })
}

// ── POST /api/services — add service ─────────────────────
export async function POST(request) {
  const { tenant, error } = await requireAuth(request)
  if (error) return error

  const { name, description } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: 'name is required.' }, { status: 400 })

  // Get current max sort_order
  const { data: existing } = await supabaseAdmin
    .from('services')
    .select('sort_order')
    .eq('tenant_id', tenant.tenantId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const sortOrder = existing?.[0]?.sort_order != null ? existing[0].sort_order + 1 : 0

  const { data, error: dbErr } = await supabaseAdmin
    .from('services')
    .insert({
      tenant_id:   tenant.tenantId,
      name:        name.trim(),
      description: (description || '').trim(),
      sort_order:  sortOrder,
    })
    .select('id, name, description, sort_order')
    .single()

  if (dbErr) return NextResponse.json({ error: 'Failed to add service.' }, { status: 500 })
  return NextResponse.json({ service: data }, { status: 201 })
}

// ── PATCH /api/services — update service ─────────────────
export async function PATCH(request) {
  const { tenant, error } = await requireAuth(request)
  if (error) return error

  const { id, name, description } = await request.json()
  if (!id) return NextResponse.json({ error: 'id is required.' }, { status: 400 })

  const updates = {}
  if (name        !== undefined) updates.name        = name.trim()
  if (description !== undefined) updates.description = description.trim()

  const { data, error: dbErr } = await supabaseAdmin
    .from('services')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', tenant.tenantId)
    .select('id, name, description')
    .single()

  if (dbErr || !data) return NextResponse.json({ error: 'Service not found.' }, { status: 404 })
  return NextResponse.json({ service: data })
}

// ── DELETE /api/services ──────────────────────────────────
export async function DELETE(request) {
  const { tenant, error } = await requireAuth(request)
  if (error) return error

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required.' }, { status: 400 })

  const { error: dbErr } = await supabaseAdmin
    .from('services')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenant.tenantId)

  if (dbErr) return NextResponse.json({ error: 'Failed to delete service.' }, { status: 500 })
  return NextResponse.json({ success: true })
}
