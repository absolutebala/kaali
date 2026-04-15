import { NextResponse }             from 'next/server'
import { supabaseAdmin }            from '@/lib/supabase'
import { hashPassword, signToken }  from '@/lib/auth'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function POST(request) {
  try {
    const { name, company, email, password } = await request.json()

    // ── Validate ────────────────────────────────────────────
    if (!name || !company || !email || !password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }

    // ── Check if email already registered ───────────────────
    const { data: existing } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
    }

    // ── Create tenant ────────────────────────────────────────
    const passwordHash = await hashPassword(password)

    const { data: tenant, error: insertError } = await supabaseAdmin
      .from('tenants')
      .insert({
        name:               name.trim(),
        company:            company.trim(),
        email:              email.toLowerCase().trim(),
        password_hash:      passwordHash,
        plan:               'starter',
        bot_name:           'Kaali',
        tone:               'friendly',
        ai_provider:        'claude',
        ai_model:           'claude-sonnet-4-20250514',
        conversations_used:  0,
        conversations_limit: 100,
        alert_email:        email.toLowerCase().trim(),
        alert_threshold:     80,
      })
      .select('id, name, company, email, plan, bot_name')
      .single()

    if (insertError) {
      console.error('[Register] DB error:', insertError)
      return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 500 })
    }

    // ── Sign JWT ─────────────────────────────────────────────
    const token = signToken({
      tenantId: tenant.id,
      email:    tenant.email,
      company:  tenant.company,
    })

    return NextResponse.json({
      token,
      tenant: {
        id:      tenant.id,
        name:    tenant.name,
        company: tenant.company,
        email:   tenant.email,
        plan:    tenant.plan,
        botName: tenant.bot_name,
      },
    }, { status: 201 })

  } catch (err) {
    console.error('[Register] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
