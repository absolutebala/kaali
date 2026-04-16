import { NextResponse }                            from 'next/server'
import { supabaseAdmin }                           from '@/lib/supabase'
import { requireSuperAdmin, hashPassword, verifyPassword } from '@/lib/superadmin-auth'

export async function OPTIONS() { return new NextResponse(null, { status: 204 }) }

export async function POST(request) {
  const { admin, error } = await requireSuperAdmin(request)
  if (error) return error

  const { currentPassword, newPassword } = await request.json()

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Both current and new password are required.' }, { status: 400 })
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 })
  }

  const { data: user } = await supabaseAdmin
    .from('superadmin_users')
    .select('password_hash')
    .eq('id', admin.adminId)
    .single()

  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

  const valid = await verifyPassword(currentPassword, user.password_hash)
  if (!valid) return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 })

  const newHash = await hashPassword(newPassword)
  await supabaseAdmin
    .from('superadmin_users')
    .update({ password_hash: newHash })
    .eq('id', admin.adminId)

  return NextResponse.json({ success: true })
}
