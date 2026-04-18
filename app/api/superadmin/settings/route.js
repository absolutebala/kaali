import { NextResponse }       from 'next/server'
import { supabaseAdmin }      from '@/lib/supabase'
import { requireSuperAdmin }  from '@/lib/superadmin-auth'

export async function OPTIONS() { return new NextResponse(null, { status: 204 }) }

export async function GET(request) {
  const { admin, error } = await requireSuperAdmin(request)
  if (error) return error
  const { data } = await supabaseAdmin.from('platform_settings').select('*').eq('id', 'singleton').single()
  return NextResponse.json({ settings: data || {} })
}

export async function POST(request) {
  const { admin, error } = await requireSuperAdmin(request, ['superadmin'])
  if (error) return error
  try {
    const formData = await request.formData()
    const file = formData.get('logo')
    if (!file) return NextResponse.json({ error: 'No file.' }, { status: 400 })
    const allowed = ['image/jpeg','image/png','image/webp','image/svg+xml']
    if (!allowed.includes(file.type)) return NextResponse.json({ error: 'Only PNG, JPG, WebP or SVG.' }, { status: 400 })
    if (file.size > 2 * 1024 * 1024) return NextResponse.json({ error: 'Max 2MB.' }, { status: 400 })
    const ext    = file.type === 'image/svg+xml' ? 'svg' : file.type.split('/')[1]
    const path   = `platform/logo.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    const { error: upErr } = await supabaseAdmin.storage.from('kaali-documents').upload(path, buffer, { contentType: file.type, upsert: true })
    if (upErr) throw upErr
    const { data: { publicUrl } } = supabaseAdmin.storage.from('kaali-documents').getPublicUrl(path)
    await supabaseAdmin.from('platform_settings').upsert({ id: 'singleton', logo_url: publicUrl, updated_at: new Date().toISOString() })
    return NextResponse.json({ logoUrl: publicUrl })
  } catch(err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
