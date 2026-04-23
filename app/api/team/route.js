import { NextResponse }  from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth }   from '@/lib/auth'
import bcrypt            from 'bcryptjs'

export async function OPTIONS() { return new NextResponse(null, { status: 204 }) }

// GET — list team members
export async function GET(request) {
  const { tenant, error } = await requireAuth(request)
  if (error) return error
  const { data } = await supabaseAdmin
    .from('tenant_members')
    .select('id, name, email, role, allowed_pages, is_active, last_login, created_at')
    .eq('tenant_id', tenant.tenantId)
    .order('created_at', { ascending: true })
  return NextResponse.json({ members: data || [] })
}

// POST — invite member
export async function POST(request) {
  const { tenant, error } = await requireAuth(request)
  if (error) return error
  const { name, email, password, role, allowedPages } = await request.json()
  if (!name?.trim() || !email?.trim() || !password || password.length < 8)
    return NextResponse.json({ error: 'Name, email and password (min 8 chars) required.' }, { status: 400 })

  // Check email not already taken
  const { data: existing } = await supabaseAdmin
    .from('tenant_members').select('id').eq('email', email.trim().toLowerCase()).maybeSingle()
  if (existing) return NextResponse.json({ error: 'Email already in use.' }, { status: 400 })

  const passwordHash = await bcrypt.hash(password, 10)
  const pages = role === 'admin' ? ['overview','leads','chats','knowledge','training','api-usage','embed','settings','team']
              : role === 'sales' ? ['overview','leads','chats']
              : allowedPages || []

  const { data, error: dbErr } = await supabaseAdmin
    .from('tenant_members')
    .insert({ tenant_id: tenant.tenantId, name: name.trim(), email: email.trim().toLowerCase(), password_hash: passwordHash, role, allowed_pages: pages })
    .select('id, name, email, role, allowed_pages, is_active, created_at')
    .single()
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ member: data })
}

// PATCH — update member
export async function PATCH(request) {
  const { tenant, error } = await requireAuth(request)
  if (error) return error
  const { id, role, allowedPages, isActive } = await request.json()
  const updates = {}
  if (role !== undefined) {
    updates.role = role
    updates.allowed_pages = role === 'admin' ? ['overview','leads','chats','knowledge','training','api-usage','embed','settings','team']
                          : role === 'sales' ? ['overview','leads','chats']
                          : allowedPages || []
  }
  if (allowedPages !== undefined && role === 'custom') updates.allowed_pages = allowedPages
  if (isActive !== undefined) updates.is_active = isActive
  await supabaseAdmin.from('tenant_members').update(updates).eq('id', id).eq('tenant_id', tenant.tenantId)
  return NextResponse.json({ success: true })
}

// DELETE — remove member
export async function DELETE(request) {
  const { tenant, error } = await requireAuth(request)
  if (error) return error
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  await supabaseAdmin.from('tenant_members').delete().eq('id', id).eq('tenant_id', tenant.tenantId)
  return NextResponse.json({ success: true })
}
