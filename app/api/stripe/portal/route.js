import { NextResponse }         from 'next/server'
import { requireAuth }          from '@/lib/auth'
import { supabaseAdmin }        from '@/lib/supabase'
import { createPortalSession }  from '@/lib/stripe'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function POST(request) {
  const { tenant, error } = await requireAuth(request)
  if (error) return error

  const { data: t } = await supabaseAdmin
    .from('tenants')
    .select('stripe_customer_id')
    .eq('id', tenant.tenantId)
    .single()

  if (!t?.stripe_customer_id) {
    return NextResponse.json({ error: 'No active subscription found.' }, { status: 404 })
  }

  try {
    const session = await createPortalSession({
      customerId: t.stripe_customer_id,
      returnUrl:  `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
