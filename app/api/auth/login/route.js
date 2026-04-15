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
