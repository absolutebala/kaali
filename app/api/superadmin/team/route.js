import { NextResponse }                              from 'next/server'
import { supabaseAdmin }                            from '@/lib/supabase'
import { requireSuperAdmin, hashPassword, ROLES }   from '@/lib/superadmin-auth'

export async function OPTIONS() { return new NextResponse(null, { status: 204 }) }

export async function GET(request) {
  const { admin, error } = await requireSuperAdmin(request, ['superadmin'])
  if (error) return error
  const { data } = await supabaseAdmin.from('superadmin_users').select('id, name, email, role, is_active, last_login, created_at').order('created_at')
  return NextResponse.json({ team: data || [] })
}

export async function POST(request) {
  const { admin, error } = await requireSuperAdmin(request, ['superadmin'])
  if (error) return error

  const { name, email, password, role } = await request.json()
  if (!name || !email || !password || !role) return NextResponse.json({ error: 'All fields required.' }, { status: 400 })
  if (!ROLES[role]) return NextResponse.json({ error: 'Invalid role.' }, { status: 400 })
  if (password.length < 8) return NextResponse.json({ error: 'Password min 8 chars.' }, { status: 400 })

  const pwHash = await hashPassword(password)
  const { data, error: dbErr } = await supabaseAdmin.from('superadmin_users')
    .insert({ name, email: email.toLowerCase(), password_hash: pwHash, role, created_by: admin.adminId })
    .select('id, name, email, role, is_active, created_at').single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 400 })
  return NextResponse.json({ member: data }, { status: 201 })
}

export async function PATCH(request) {
  const { admin, error } = await requireSuperAdmin(request, ['superadmin'])
  if (error) return error

  const { id, role, isActive } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required.' }, { status: 400 })
  if (id === admin.adminId) return NextResponse.json({ error: 'Cannot modify your own account here.' }, { status: 400 })

  const updates = {}
  if (role     !== undefined) updates.role      = role
  if (isActive !== undefined) updates.is_active = isActive

  const { data } = await supabaseAdmin.from('superadmin_users').update(updates).eq('id', id).select('id, name, email, role, is_active').single()
  return NextResponse.json({ member: data })
}

export async function DELETE(request) {
  const { admin, error } = await requireSuperAdmin(request, ['superadmin'])
  if (error) return error

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required.' }, { status: 400 })
  if (id === admin.adminId) return NextResponse.json({ error: 'Cannot delete your own account.' }, { status: 400 })

  await supabaseAdmin.from('superadmin_users').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
