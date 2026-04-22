import { NextResponse }              from 'next/server'
import { supabaseAdmin }             from '@/lib/supabase'
import { verifyPassword, signToken } from '@/lib/auth'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    // ── Check tenant_members first ────────────────────────────
    const { data: member } = await supabaseAdmin
      .from('tenant_members')
      .select('id, name, email, password_hash, tenant_id, role, allowed_pages, is_active')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    if (member) {
      if (!member.is_active) return NextResponse.json({ error: 'Account is inactive.' }, { status: 401 })
      const ok = await verifyPassword(password, member.password_hash)
      if (!ok) return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })

      // Get tenant info for the member
      const { data: tenantData } = await supabaseAdmin
        .from('tenants')
        .select('id, company, plan, bot_name, bubble_color, widget_mode')
        .eq('id', member.tenant_id)
        .single()

      await supabaseAdmin.from('tenant_members').update({ last_login: new Date().toISOString() }).eq('id', member.id)

      const token = signToken({ tenantId: member.tenant_id, memberId: member.id, memberRole: member.role, allowedPages: member.allowed_pages })
      return NextResponse.json({
        token,
        tenant: { id: member.tenant_id, name: member.name, email: member.email, company: tenantData?.company, plan: tenantData?.plan, isMember: true, memberRole: member.role, allowedPages: member.allowed_pages }
      })
    }

    // ── Fetch tenant ──────────────────────────────────────────
    const { data: tenant, error } = await supabaseAdmin
      .from('tenants')
      .select('id, name, company, email, password_hash, plan, bot_name, tone, ai_provider, ai_model, calendly_url, alert_threshold')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (error || !tenant) {
      // Use generic message to prevent email enumeration
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    // ── Verify password ───────────────────────────────────────
    const valid = await verifyPassword(password, tenant.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    // ── Sign JWT ──────────────────────────────────────────────
    const token = signToken({
      tenantId: tenant.id,
      email:    tenant.email,
      company:  tenant.company,
    })

    return NextResponse.json({
      token,
      tenant: {
        id:         tenant.id,
        name:       tenant.name,
        company:    tenant.company,
        email:      tenant.email,
        plan:       tenant.plan,
        botName:    tenant.bot_name,
        tone:       tenant.tone,
        aiProvider: tenant.ai_provider,
        aiModel:    tenant.ai_model,
        calendly:   tenant.calendly_url,
      },
    })

  } catch (err) {
    console.error('[Login] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
