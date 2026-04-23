import { NextResponse }  from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth }   from '@/lib/auth'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function GET(request) {
  const { tenant: payload, error } = await requireAuth(request)
  if (error) return error

  // Handle team member tokens
  if (payload.memberId) {
    const [{ data: member }, { data: tenantData }] = await Promise.all([
      supabaseAdmin.from('tenant_members').select('id, name, email, role, allowed_pages, is_active').eq('id', payload.memberId).single(),
      supabaseAdmin.from('tenants').select('id, company, plan, bot_name, avatar_url, bubble_color, widget_mode').eq('id', payload.tenantId).single(),
    ])
    if (!member || !member.is_active) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ tenant: {
      id: payload.tenantId, name: member.name, email: member.email,
      company: tenantData?.company || '', plan: tenantData?.plan || 'starter',
      botName: tenantData?.bot_name || 'Kaali', avatarUrl: tenantData?.avatar_url || '',
      bubbleColor: tenantData?.bubble_color || '#4F8EF7', widgetMode: tenantData?.widget_mode || 'bubble',
      isMember: true, memberRole: member.role, allowedPages: member.allowed_pages || [],
    }})
  }

  const { data: tenant, error: dbErr } = await supabaseAdmin
    .from('tenants')
    .select('id, name, company, email, plan, bot_name, description, tone, ai_provider, ai_model, calendly_url, conversations_used, conversations_limit, alert_email, alert_threshold, hubspot_token, zapier_webhook_url, avatar_url, bubble_color, widget_mode, visitor_btn_1, visitor_btn_2, visitor_btn_3, visitor_btn_4, b2b_mode, created_at')
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
      visitorBtn1:       tenant.visitor_btn_1       || 'I am looking to build a product',
      visitorBtn2:       tenant.visitor_btn_2       || 'I am your existing client',
      visitorBtn3:       tenant.visitor_btn_3       || 'I am an investor',
      visitorBtn4:       tenant.visitor_btn_4       || 'Just exploring',
      b2bMode:           tenant.b2b_mode            || false,
      createdAt:         tenant.created_at,
    },
    services:  services  || [],
    documents: documents || [],
  })
}
