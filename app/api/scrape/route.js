import { NextResponse }  from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { requireAuth }   from '../../../../lib/auth'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

// ── POST /api/scrape ──────────────────────────────────────
// Body: { url }
// Fetches the URL, extracts clean text, stores as a document
export async function POST(request) {
  const { tenant, error } = await requireAuth(request)
  if (error) return error

  const { url } = await request.json()

  if (!url?.trim()) {
    return NextResponse.json({ error: 'URL is required.' }, { status: 400 })
  }

  // Validate URL
  let parsedUrl
  try {
    parsedUrl = new URL(url.trim())
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid protocol')
    }
  } catch {
    return NextResponse.json({ error: 'Please enter a valid URL starting with http:// or https://' }, { status: 400 })
  }

  try {
    // Fetch the page
    const res = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KaaliBot/1.0; +https://kaali.absoluteapplabs.com)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(15000), // 15s timeout
    })

    if (!res.ok) {
      return NextResponse.json({ error: `Could not fetch URL (status ${res.status}). Make sure the URL is publicly accessible.` }, { status: 400 })
    }

    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('text/html')) {
      return NextResponse.json({ error: 'URL does not return an HTML page.' }, { status: 400 })
    }

    const html = await res.text()

    // Extract clean text from HTML
    const text = extractText(html)

    if (!text || text.length < 100) {
      return NextResponse.json({ error: 'Could not extract meaningful content from this URL.' }, { status: 400 })
    }

    // Cap at 50k chars
    const extractedText = text.substring(0, 50000)
    const domain  = parsedUrl.hostname
    const urlPath = parsedUrl.pathname !== '/' ? parsedUrl.pathname : ''
    const docName = `Website: ${domain}${urlPath}`

    // Check if we already have a doc for this exact URL — update it
    const { data: existing } = await supabaseAdmin
      .from('documents')
      .select('id')
      .eq('tenant_id', tenant.tenantId)
      .eq('file_path', parsedUrl.toString())
      .maybeSingle()

    let doc
    if (existing) {
      const { data } = await supabaseAdmin
        .from('documents')
        .update({
          name:           docName,
          extracted_text: extractedText,
          file_size_kb:   Math.round(extractedText.length / 1024),
          file_path:      parsedUrl.toString(),
        })
        .eq('id', existing.id)
        .select('id, name, file_size_kb, created_at')
        .single()
      doc = data
    } else {
      const { data } = await supabaseAdmin
        .from('documents')
        .insert({
          tenant_id:      tenant.tenantId,
          name:           docName,
          file_path:      parsedUrl.toString(),
          extracted_text: extractedText,
          file_size_kb:   Math.round(extractedText.length / 1024),
        })
        .select('id, name, file_size_kb, created_at')
        .single()
      doc = data
    }

    return NextResponse.json({
      document: doc,
      charCount: extractedText.length,
      message: `Successfully extracted ${extractedText.length.toLocaleString()} characters from ${docName}`,
    }, { status: 201 })

  } catch (err) {
    if (err.name === 'TimeoutError') {
      return NextResponse.json({ error: 'Request timed out. The URL took too long to respond.' }, { status: 400 })
    }
    console.error('[Scrape]', err)
    return NextResponse.json({ error: 'Failed to fetch URL. Make sure it is publicly accessible.' }, { status: 500 })
  }
}

// ── Extract clean text from HTML ──────────────────────────
function extractText(html) {
  // Remove script, style, nav, footer, header tags and their content
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, ' ')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')

  // Convert block elements to newlines
  text = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')

  // Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ')

  // Decode common HTML entities
  text = text
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g,  "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')

  // Clean up whitespace
  text = text
    .replace(/\t/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return text
}
