import { NextResponse }  from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// ── GET /api/widget-config/[tenantId] ─────────────────────
// PUBLIC endpoint — called by widget.js on every page load.
// Returns ONLY the config the widget needs — NO API keys, NO sensitive data.
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function GET(request, { params }) {
  const { tenantId } = params

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId required.' }, { status: 400 })
  }

  const { data: tenant, error } = await supabaseAdmin
    .from('tenants')
    .select('id, company, bot_name, tone, calendly_url, plan, conversations_used, conversations_limit, avatar_url, bubble_color, widget_mode')
    .eq('id', tenantId)
    .single()

  if (error || !tenant) {
    return NextResponse.json({ error: 'Workspace not found.' }, { status: 404 })
  }

  // Return ONLY public-safe config — never the API key
  return NextResponse.json({
    tenantId:   tenant.id,
    company:    tenant.company,
    botName:    tenant.bot_name,
    tone:       tenant.tone,
    calendly:   tenant.calendly_url,
    apiUrl:     (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/+$/, '') + '/api/chat',
    limited:     tenant.conversations_used >= tenant.conversations_limit,
    avatarUrl:   tenant.avatar_url    || '',
    bubbleColor: tenant.bubble_color  || '#4F8EF7',
    widgetMode:  tenant.widget_mode   || 'bubble',
  }, {
    headers: {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    },
  })
}
