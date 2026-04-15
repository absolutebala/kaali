import { NextResponse }  from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth }   from '@/lib/auth'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

// ── GET /api/documents ────────────────────────────────────
export async function GET(request) {
  const { tenant, error } = await requireAuth(request)
  if (error) return error

  const { data } = await supabaseAdmin
    .from('documents')
    .select('id, name, file_size_kb, created_at')
    .eq('tenant_id', tenant.tenantId)
    .order('created_at', { ascending: false })

  return NextResponse.json({ documents: data || [] })
}

// ── POST /api/documents — upload PDF ─────────────────────
// Accepts multipart/form-data with a 'file' field
export async function POST(request) {
  const { tenant, error } = await requireAuth(request)
  if (error) return error

  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }

    const allowedTypes = ['application/pdf', 'text/plain']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only PDF and TXT files are supported.' }, { status: 400 })
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 })
    }

    const bytes    = await file.arrayBuffer()
    const buffer   = Buffer.from(bytes)
    const filePath = `${tenant.tenantId}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`

    // ── Upload to Supabase Storage ────────────────────────
    const { error: uploadErr } = await supabaseAdmin
      .storage
      .from('kaali-documents')
      .upload(filePath, buffer, { contentType: file.type, upsert: false })

    if (uploadErr) {
      console.error('[Documents] Upload error:', uploadErr)
      return NextResponse.json({ error: 'Failed to upload file.' }, { status: 500 })
    }

    // ── Extract text ──────────────────────────────────────
    let extractedText = ''
    if (file.type === 'application/pdf') {
      try {
        // Dynamic import so build doesn't fail if pdf-parse isn't installed
        const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default
        const parsed   = await pdfParse(buffer)
        extractedText  = parsed.text?.substring(0, 50000) || ''  // cap at 50k chars
      } catch (e) {
        console.warn('[Documents] PDF parse failed:', e.message)
        extractedText = '[PDF text extraction failed — document uploaded but not searchable]'
      }
    } else if (file.type === 'text/plain') {
      extractedText = buffer.toString('utf8').substring(0, 50000)
    }

    // ── Save metadata to DB ───────────────────────────────
    const { data: doc, error: dbErr } = await supabaseAdmin
      .from('documents')
      .insert({
        tenant_id:      tenant.tenantId,
        name:           file.name,
        file_path:      filePath,
        extracted_text: extractedText,
        file_size_kb:   Math.round(file.size / 1024),
      })
      .select('id, name, file_size_kb, created_at')
      .single()

    if (dbErr) {
      console.error('[Documents] DB insert error:', dbErr)
      return NextResponse.json({ error: 'Failed to save document record.' }, { status: 500 })
    }

    return NextResponse.json({ document: doc }, { status: 201 })

  } catch (err) {
    console.error('[Documents] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

// ── DELETE /api/documents?id=<uuid> ──────────────────────
export async function DELETE(request) {
  const { tenant, error } = await requireAuth(request)
  if (error) return error

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required.' }, { status: 400 })

  // Get file path first
  const { data: doc } = await supabaseAdmin
    .from('documents')
    .select('file_path')
    .eq('id', id)
    .eq('tenant_id', tenant.tenantId)
    .single()

  if (!doc) return NextResponse.json({ error: 'Document not found.' }, { status: 404 })

  // Delete from Storage
  await supabaseAdmin.storage.from('kaali-documents').remove([doc.file_path])

  // Delete from DB
  await supabaseAdmin.from('documents').delete().eq('id', id)

  return NextResponse.json({ success: true })
}
