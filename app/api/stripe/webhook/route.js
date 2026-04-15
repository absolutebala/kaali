import { NextResponse } from 'next/server'
import { stripe }        from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

// Must be raw body — no JSON parsing
export async function POST(request) {
  const sig     = request.headers.get('stripe-signature')
  const rawBody = await request.text()

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 })
  }

  console.log(`[Stripe Webhook] ${event.type}`)

  try {
    switch (event.type) {

      // ── Checkout completed → activate plan ────────────────
      case 'checkout.session.completed': {
        const session  = event.data.object
        const tenantId = session.metadata?.tenantId
        const plan     = session.metadata?.plan
        if (!tenantId || !plan) break

        const planLimits = { growth: 2000, business: 999999 }

        await supabaseAdmin
          .from('tenants')
          .update({
            plan,
            conversations_limit:  planLimits[plan] || 100,
            stripe_customer_id:   session.customer,
            stripe_subscription_id: session.subscription,
            alert_sent:           false,  // reset alert on upgrade
          })
          .eq('id', tenantId)

        console.log(`[Stripe] Upgraded tenant ${tenantId} to ${plan}`)
        break
      }

      // ── Subscription cancelled / unpaid → downgrade ───────
      case 'customer.subscription.deleted':
      case 'invoice.payment_failed': {
        const obj        = event.data.object
        const customerId = obj.customer || obj.id
        if (!customerId) break

        await supabaseAdmin
          .from('tenants')
          .update({ plan: 'starter', conversations_limit: 100 })
          .eq('stripe_customer_id', customerId)

        console.log(`[Stripe] Downgraded customer ${customerId} to starter`)
        break
      }

      // ── Subscription renewed → reset monthly usage ────────
      case 'invoice.payment_succeeded': {
        const invoice    = event.data.object
        const customerId = invoice.customer
        // Only reset on renewal (billing_reason = subscription_cycle)
        if (invoice.billing_reason !== 'subscription_cycle') break

        await supabaseAdmin
          .from('tenants')
          .update({
            conversations_used: 0,
            alert_sent:         false,
            usage_reset_at:     new Date(Date.now() + 30 * 86400000).toISOString(),
          })
          .eq('stripe_customer_id', customerId)

        console.log(`[Stripe] Reset usage for customer ${customerId}`)
        break
      }
    }
  } catch (err) {
    console.error('[Stripe Webhook] Handler error:', err)
  }

  return NextResponse.json({ received: true })
}
