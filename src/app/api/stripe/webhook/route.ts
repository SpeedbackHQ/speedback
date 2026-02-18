import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { sendWelcomeEmail, sendPaymentConfirmationEmail } from '@/lib/email'

let _stripe: Stripe | null = null
function getStripe(): Stripe {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-01-28.clover' })
  return _stripe
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const customerEmail = session.customer_details?.email || session.customer_email

      if (customerEmail) {
        const isSubscription = session.mode === 'subscription'
        const plan = isSubscription ? 'Starter' : 'Per Event'
        const amount = isSubscription ? '$19/month' : '$15'

        // Send both emails in parallel
        await Promise.all([
          sendWelcomeEmail(customerEmail, session.customer_details?.name || undefined),
          sendPaymentConfirmationEmail(customerEmail, plan, amount),
        ])

        console.log(`[webhook] Sent welcome + confirmation to ${customerEmail} (${plan})`)
      }
    }
  } catch (err) {
    console.error('[webhook] Email send failed:', err)
    // Don't return error — Stripe would retry unnecessarily
  }

  return NextResponse.json({ received: true })
}
