import { NextResponse }  from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { requireAuth }   from '../../../../lib/auth'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function POST(request) {
  const { tenant, error } = await requireAuth(request)
  if (error) return error

  const { url } = await request.json()
  if (!url?.trim()) return NextResponse.json({ error: 'URL is required.' }, { status: 400 })

  let parsedUrl
  try {
    parsedUrl = new URL(url.trim())
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('Invalid')
  } catch {
    return NextResponse.json({ error: 'Please enter a valid URL starting with http:// or https://' }, { status: 400 })
  }

  try {
    const res = await fetch(parsedUrl.toString(), {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KaaliBot/1.0)' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return NextResponse.json({ error: `Could not fetch URL (${res.status})` }, { status: 400 })

    const html  = await res.text()
    const text  = extractText(html).substring(0, 50000)
    if (text.length < 100) return NextResponse.json({ error: 'Could not extract meaningful content.' }, { status: 400 })

    const domain  = parsedUrl.hostname
    const docName = `Website: ${domain}`

    const { data: existing } = await supabaseAdmin
      .from('documents').select('id')
      .eq('tenant_id', tenant.tenantId).ilike('name', `Website: ${domain}%`).single()

    let doc
    if (existing) {
      const { data } = await supabaseAdmin.from('documents')
        .update({ name: docName, extracted_text: text, file_size_kb: Math.round(text.length/1024), file_path: parsedUrl.toString() })
        .eq('id', existing.id).select('id, name, file_size_kb, created_at').single()
      doc = data
    } else {
      const { data } = await supabaseAdmin.from('documents')
        .insert({ tenant_id: tenant.tenantId, name: docName, file_path: parsedUrl.toString(), extracted_text: text, file_size_kb: Math.round(text.length/1024) })
        .select('id, name, file_size_kb, created_at').single()
      doc = data
    }

    return NextResponse.json({ document: doc, charCount: text.length, message: `Extracted ${text.length.toLocaleString()} characters from ${domain}` }, { status: 201 })
  } catch (err) {
    if (err.name === 'TimeoutError') return NextResponse.json({ error: 'Request timed out.' }, { status: 400 })
    return NextResponse.json({ error: 'Failed to fetch URL.' }, { status: 500 })
  }
}

function extractText(html) {
  let t = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n').replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
    .replace(/&quot;/g,'"').replace(/&nbsp;/g,' ')
    .replace(/[ ]{2,}/g,' ').replace(/\n{3,}/g,'\n\n').trim()
  return t
}
