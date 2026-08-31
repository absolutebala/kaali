import { NextResponse }  from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { signToken }     from '@/lib/auth'

export async function POST(request) {
  try {
    const { email, name, provider, company } = await request.json()
    let isNew = false

    if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 })

    // Find or create tenant
    let { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (!tenant) {
      const companyName = (company || email.split('@')[1]?.split('.')[0] || 'My Company')
      const { data: newTenant, error: createErr } = await supabaseAdmin
        .from('tenants')
        .insert({
          name,
          email,
          company:             companyName.charAt(0).toUpperCase() + companyName.slice(1),
          password_hash:       `oauth:${provider}`,
          plan:                'starter',
          conversations_used:  0,
          conversations_limit: 50,
          bot_name:            'Assistant',
          ai_provider:         'claude',
          ai_model:            'claude-sonnet-4-5',
          alert_email:         email,
        })
        .select('*')
        .single()

      if (createErr) throw new Error(createErr.message)
      tenant = newTenant
      isNew = true
    }

    const token = signToken({ tenantId: tenant.id, email: tenant.email })
    return NextResponse.json({ token, isNew, tenant: { id: tenant.id, name: tenant.name, email: tenant.email, company: tenant.company, plan: tenant.plan } })
  } catch (err) {
    console.error('[SocialLogin]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
