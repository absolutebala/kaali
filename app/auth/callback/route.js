import { NextResponse }    from 'next/server'
import { createClient }    from '@supabase/supabase-js'
import { supabaseAdmin }   from '@/lib/supabase'
import { signToken }       from '@/lib/auth'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error)}`)
  if (!code) return NextResponse.redirect(`${origin}/auth/login?error=no_code`)

  try {
    // Exchange code for session
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    if (sessionError || !session) throw new Error(sessionError?.message || 'No session')

    const oauthUser = session.user
    const email     = oauthUser.email
    const fullName  = oauthUser.user_metadata?.full_name || oauthUser.user_metadata?.name || email.split('@')[0]
    const provider  = oauthUser.app_metadata?.provider || 'oauth'

    // Check if tenant already exists
    let { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('*')
      .eq('email', email)
      .single()

    if (!tenant) {
      // Auto-register new tenant from social login
      const company = oauthUser.user_metadata?.company ||
        (oauthUser.user_metadata?.hd) ||  // Google Workspace domain
        email.split('@')[1]?.split('.')[0] || 'My Company'

      const { data: newTenant, error: createErr } = await supabaseAdmin
        .from('tenants')
        .insert({
          name:                fullName,
          email,
          company:             company.charAt(0).toUpperCase() + company.slice(1),
          password_hash:       'oauth:' + provider,
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
    }

    // Generate JWT token for our app
    const token = signToken({ tenantId: tenant.id, email: tenant.email })

    // Redirect to dashboard with token in URL (client will store it)
    return NextResponse.redirect(`${origin}/auth/social-success?token=${token}`)
  } catch (err) {
    console.error('[OAuth Callback]', err.message)
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(err.message)}`)
  }
}
