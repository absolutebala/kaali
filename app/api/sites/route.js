import { NextResponse }  from 'next/server'
import { requireAuth }   from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { signToken }     from '@/lib/auth'

// GET - list all sites for this tenant (parent + children)
export async function GET(request) {
  const { tenant, error } = await requireAuth(request)
  if (error) return error

  // Get the root tenant ID (parent or self)
  const { data: self } = await supabaseAdmin
    .from('tenants').select('id, parent_tenant_id, site_label, company')
    .eq('id', tenant.tenantId).single()

  const rootId = self.parent_tenant_id || self.id

  // Get root + all children
  const { data: sites } = await supabaseAdmin
    .from('tenants')
    .select('id, site_label, company, bot_name, bubble_color, conversations_used, conversations_limit, created_at')
    .or(`id.eq.${rootId},parent_tenant_id.eq.${rootId}`)
    .order('created_at')

  return NextResponse.json({ sites: sites || [] })
}

// POST - create a new site (Growth/Enterprise only, max 10)
export async function POST(request) {
  const { tenant, error } = await requireAuth(request)
  if (error) return error

  // Get root tenant
  const { data: self } = await supabaseAdmin
    .from('tenants').select('*').eq('id', tenant.tenantId).single()

  const rootId = self.parent_tenant_id || self.id
  const { data: root } = await supabaseAdmin
    .from('tenants').select('*').eq('id', rootId).single()

  // Check plan
  if (!['growth', 'enterprise'].includes(root.plan)) {
    return NextResponse.json({ error: 'Multi-site requires Growth or Enterprise plan.' }, { status: 403 })
  }

  // Count existing sites
  const { count } = await supabaseAdmin
    .from('tenants').select('*', { count: 'exact', head: true })
    .or(`id.eq.${rootId},parent_tenant_id.eq.${rootId}`)

  if (count >= 10) {
    return NextResponse.json({ error: 'Maximum 10 sites reached.' }, { status: 400 })
  }

  const { label } = await request.json()
  if (!label?.trim()) return NextResponse.json({ error: 'Site label required.' }, { status: 400 })

  // Create child tenant copying root settings
  const { data: newSite, error: createErr } = await supabaseAdmin
    .from('tenants').insert({
      name:                root.name,
      email:               `site_${Date.now()}@internal.nivochat`,
      password_hash:       root.password_hash,
      company:             root.company,
      plan:                root.plan,
      parent_tenant_id:    rootId,
      site_label:          label.trim(),
      bot_name:            root.bot_name || 'Assistant',
      ai_provider:         root.ai_provider || 'claude',
      ai_model:            root.ai_model || 'claude-sonnet-4-5',
      alert_email:         root.alert_email || root.email,
      conversations_used:  0,
      conversations_limit: 999999,
      bubble_color:        root.bubble_color || '#4F8EF7',
    }).select('*').single()

  if (createErr) return NextResponse.json({ error: createErr.message }, { status: 500 })

  // Return token for the new site
  const token = signToken({ tenantId: newSite.id, email: newSite.email })
  return NextResponse.json({ site: newSite, token })
}
