import { NextResponse }  from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth }   from '@/lib/auth'

export async function OPTIONS() { return new NextResponse(null, { status: 204 }) }

export async function POST(request) {
  const { tenant, error } = await requireAuth(request)
  if (error) return error

  try {
    const formData = await request.formData()
    const file = formData.get('avatar')
    if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 })

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, WebP or GIF allowed.' }, { status: 400 })
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image must be under 2MB.' }, { status: 400 })
    }

    const ext      = file.type.split('/')[1]
    const path     = `avatars/${tenant.tenantId}.${ext}`
    const buffer   = Buffer.from(await file.arrayBuffer())

    // Upload to Supabase Storage
    const { error: uploadErr } = await supabaseAdmin.storage
      .from('kaali-documents')
      .upload(path, buffer, { contentType: file.type, upsert: true })

    if (uploadErr) throw uploadErr

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('kaali-documents')
      .getPublicUrl(path)

    // Save to tenant
    await supabaseAdmin.from('tenants').update({ avatar_url: publicUrl }).eq('id', tenant.tenantId)

    return NextResponse.json({ avatarUrl: publicUrl })
  } catch (err) {
    console.error('[Avatar upload]', err)
    return NextResponse.json({ error: err.message || 'Upload failed.' }, { status: 500 })
  }
}
