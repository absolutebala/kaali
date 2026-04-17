import { NextResponse }  from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth }   from '@/lib/auth'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function GET(request) {
  const { tenant: payload, error } = await requireAuth(request)
  if (error) return error

  const { data: tenant, error: dbErr } = await supabaseAdmin
    .from('tenants')
    .select('id, name, company, email, plan, bot_name, description, tone, ai_provider, ai_model, calendly_url, conversations_used, conversations_limit, alert_email, alert_threshold, hubspot_token, zapier_webhook_url, avatar_url, bubble_color, widget_mode, created_at')
    .eq('id', payload.tenantId)
    .single()

  if (dbErr || !tenant) {
    return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 })
  }

  // Fetch services
  const { data: services } = await supabaseAdmin
    .from('services')
    .select('id, name, description, sort_order')
    .eq('tenant_id', tenant.id)
    .order('sort_order')

  // Fetch documents (metadata only, not extracted text)
  const { data: documents } = await supabaseAdmin
    .from('documents')
    .select('id, name, file_size_kb, created_at')
    .eq('tenant_id', tenant.id)

  return NextResponse.json({
    tenant: {
      id:                tenant.id,
      name:              tenant.name,
      company:           tenant.company,
      email:             tenant.email,
      plan:              tenant.plan,
      botName:           tenant.bot_name,
      description:       tenant.description,
      tone:              tenant.tone,
      aiProvider:        tenant.ai_provider,
      aiModel:           tenant.ai_model,
      calendly:          tenant.calendly_url,
      used:              tenant.conversations_used,
      limit:             tenant.conversations_limit,
      alertEmail:        tenant.alert_email,
      alertThreshold:    tenant.alert_threshold,
      hubspotToken:      tenant.hubspot_token      || '',
      zapierWebhookUrl:  tenant.zapier_webhook_url  || '',
      avatarUrl:         tenant.avatar_url         || '',
      bubbleColor:       tenant.bubble_color        || '#4F8EF7',
      widgetMode:        tenant.widget_mode         || 'bubble',
      createdAt:         tenant.created_at,
    },
    services:  services  || [],
    documents: documents || [],
  })
}
