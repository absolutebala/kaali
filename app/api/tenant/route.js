import { NextResponse }          from 'next/server'
import { supabaseAdmin }         from '@/lib/supabase'
import { requireAuth, encryptKey } from '@/lib/auth'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

// ── GET /api/tenant — fetch full config ───────────────────
export async function GET(request) {
  const { tenant: payload, error } = await requireAuth(request)
  if (error) return error

  const { data, error: dbErr } = await supabaseAdmin
    .from('tenants')
    .select('id, name, company, email, plan, bot_name, description, tone, ai_provider, ai_model, calendly_url, conversations_used, conversations_limit, alert_email, alert_threshold, alert_sent, hubspot_token, zapier_webhook_url, avatar_url, bubble_color, widget_mode, visitor_btn_1, visitor_btn_2, visitor_btn_3, visitor_btn_4')
    .eq('id', payload.tenantId)
    .single()

  if (dbErr) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ tenant: data })
}

// ── PATCH /api/tenant — update settings ───────────────────
export async function PATCH(request) {
  const { tenant: payload, error } = await requireAuth(request)
  if (error) return error

  const body = await request.json()

  // Build the update object — only accept known fields
  const updates = {}

  if (body.botName    !== undefined) updates.bot_name     = body.botName.trim() || 'Kaali'
  if (body.description !== undefined) updates.description  = body.description
  if (body.tone       !== undefined) updates.tone          = body.tone
  if (body.calendly   !== undefined) updates.calendly_url  = body.calendly.trim()
  if (body.aiProvider !== undefined) updates.ai_provider   = body.aiProvider
  if (body.aiModel    !== undefined) updates.ai_model      = body.aiModel
  if (body.alertEmail       !== undefined) updates.alert_email        = body.alertEmail.trim()
  if (body.companyName      !== undefined) updates.company             = body.companyName.trim()
  if (body.hubspotToken     !== undefined) updates.hubspot_token       = body.hubspotToken.trim()
  if (body.zapierWebhookUrl !== undefined) updates.zapier_webhook_url  = body.zapierWebhookUrl.trim()
  if (body.avatarUrl   !== undefined) updates.avatar_url   = body.avatarUrl.trim()
  if (body.bubbleColor !== undefined) updates.bubble_color = body.bubbleColor.trim()
  if (body.widgetMode  !== undefined) updates.widget_mode  = body.widgetMode.trim()
  if (body.visitorBtn1 !== undefined) updates.visitor_btn_1 = body.visitorBtn1
  if (body.visitorBtn2 !== undefined) updates.visitor_btn_2 = body.visitorBtn2
  if (body.visitorBtn3 !== undefined) updates.visitor_btn_3 = body.visitorBtn3
  if (body.visitorBtn4 !== undefined) updates.visitor_btn_4 = body.visitorBtn4
  if (body.alertThreshold !== undefined) {
    updates.alert_threshold = parseInt(body.alertThreshold)
    updates.alert_sent      = false   // reset so alert fires again at new threshold
  }

  // Encrypt API key before storing
  if (body.apiKey !== undefined && body.apiKey.trim()) {
    updates.api_key_enc = encryptKey(body.apiKey.trim())
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 })
  }

  updates.updated_at = new Date().toISOString()

  const { data, error: dbErr } = await supabaseAdmin
    .from('tenants')
    .update(updates)
    .eq('id', payload.tenantId)
    .select('id, bot_name, tone, ai_provider, ai_model, calendly_url, alert_email, alert_threshold')
    .single()

  if (dbErr) {
    console.error('[Tenant PATCH]', dbErr)
    return NextResponse.json({ error: 'Failed to update settings.' }, { status: 500 })
  }

  return NextResponse.json({ tenant: data })
}
