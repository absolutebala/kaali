import { NextResponse }  from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireSuperAdmin as requireSA }     from '@/lib/superadmin-auth'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  // Public endpoint — used by tenant dashboard to fetch active announcements
  const isPublic = searchParams.get('public') === 'true'

  if (!isPublic) {
    const { admin, error } = await requireSA(request)
    if (error) return error
  }

  const { data } = await supabaseAdmin
    .from('announcements')
    .select('id, title, message, type, is_active, created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return NextResponse.json({ announcements: data || [] })
}

export async function POST(request) {
  const { admin, error } = await requireSA(request)
  if (error) return error

  const { title, message, type } = await request.json()
  if (!title || !message) return NextResponse.json({ error: 'title and message required.' }, { status: 400 })

  const { data } = await supabaseAdmin
    .from('announcements')
    .insert({ title, message, type: type || 'info' })
    .select()
    .single()

  return NextResponse.json({ announcement: data }, { status: 201 })
}

export async function PATCH(request) {
  const { admin, error } = await requireSA(request)
  if (error) return error

  const { id, isActive } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required.' }, { status: 400 })

  const { data } = await supabaseAdmin
    .from('announcements')
    .update({ is_active: isActive })
    .eq('id', id)
    .select()
    .single()

  return NextResponse.json({ announcement: data })
}

export async function DELETE(request) {
  const { admin, error } = await requireSA(request)
  if (error) return error

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required.' }, { status: 400 })

  await supabaseAdmin.from('announcements').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
