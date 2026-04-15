import { NextResponse }               from 'next/server'
import { requireAuth }                from '@/lib/auth'
import { supabaseAdmin }              from '@/lib/supabase'
import { createCheckoutSession }      from '@/lib/stripe'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function POST(request) {
  const { tenant, error } = await requireAuth(request)
  if (error) return error

  const { plan } = await request.json()

  if (!['growth', 'business'].includes(plan)) {
    return NextResponse.json({ error: 'Invalid plan. Choose growth or business.' }, { status: 400 })
  }

  // Get tenant data for email
  const { data: t } = await supabaseAdmin
    .from('tenants')
    .select('email, company, stripe_customer_id')
    .eq('id', tenant.tenantId)
    .single()

  if (!t) return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  try {
    const session = await createCheckoutSession({
      tenantId:   tenant.tenantId,
      email:      t.email,
      plan,
      successUrl: `${appUrl}/dashboard?upgrade=success`,
      cancelUrl:  `${appUrl}/dashboard?upgrade=cancelled`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[Stripe Checkout]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
