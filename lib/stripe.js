import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('[Stripe] STRIPE_SECRET_KEY not set. Billing will not work.')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-06-20',
})

// ── Plan config ───────────────────────────────────────────
export const PLANS = {
  starter: {
    name:              'Starter',
    price:             0,
    conversationLimit: 100,
    documentLimit:     1,
    stripePriceId:     null,
  },
  growth: {
    name:              'Growth',
    price:             29,
    conversationLimit: 2000,
    documentLimit:     10,
    stripePriceId:     process.env.STRIPE_PRICE_GROWTH,
  },
  business: {
    name:              'Business',
    price:             79,
    conversationLimit: 999999,
    documentLimit:     999,
    stripePriceId:     process.env.STRIPE_PRICE_BUSINESS,
  },
}

export function getPlan(planName) {
  return PLANS[planName] || PLANS.starter
}

// ── Create Stripe Checkout Session ───────────────────────
export async function createCheckoutSession({ tenantId, email, plan, successUrl, cancelUrl }) {
  const planConfig = getPlan(plan)
  if (!planConfig.stripePriceId) {
    throw new Error(`No Stripe price ID configured for plan: ${plan}`)
  }

  const session = await stripe.checkout.sessions.create({
    mode:               'subscription',
    payment_method_types: ['card'],
    customer_email:     email,
    line_items: [{ price: planConfig.stripePriceId, quantity: 1 }],
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  cancelUrl,
    metadata: {
      tenantId,
      plan,
    },
    subscription_data: {
      metadata: { tenantId, plan },
    },
  })

  return session
}

// ── Create Customer Portal Session ────────────────────────
export async function createPortalSession({ customerId, returnUrl }) {
  const session = await stripe.billingPortal.sessions.create({
    customer:   customerId,
    return_url: returnUrl,
  })
  return session
}
