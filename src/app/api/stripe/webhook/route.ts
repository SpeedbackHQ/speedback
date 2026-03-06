import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { sendWelcomeEmail, sendPaymentConfirmationEmail } from '@/lib/email'
import { createClient } from '@supabase/supabase-js'

let _stripe: Stripe | null = null
function getStripe(): Stripe {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-01-28.clover' })
  return _stripe
}

// Create Supabase admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
        const planType = isSubscription ? 'starter' : 'per-event'
        const plan = isSubscription ? 'Starter' : 'Per Event'
        const amount = isSubscription ? '$19/month' : '$15'

        // Find user by email
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
        const user = users.find(u => u.email === customerEmail)

        if (user) {
          // Update user profile plan type
          await supabaseAdmin
            .from('user_profiles')
            .upsert({
              id: user.id,
              plan_type: planType,
              stripe_customer_id: session.customer as string,
              updated_at: new Date().toISOString(),
            })

          // Create/update subscription record if this is a subscription
          if (isSubscription && session.subscription) {
            const subscriptionId = session.subscription as string
            const subResponse = await getStripe().subscriptions.retrieve(subscriptionId)
            const sub = subResponse as any // Stripe SDK type issues

            await supabaseAdmin
              .from('subscriptions')
              .upsert({
                user_id: user.id,
                stripe_subscription_id: subscriptionId,
                stripe_customer_id: session.customer as string,
                plan_type: planType,
                status: sub.status,
                current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
                current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
                cancel_at_period_end: sub.cancel_at_period_end || false,
                updated_at: new Date().toISOString(),
              })

            console.log(`[webhook] Synced subscription ${subscriptionId} for user ${user.id}`)

            // For subscription: upgrade ALL surveys to unlimited responses
            await supabaseAdmin
              .from('surveys')
              .update({ max_responses: null })
              .eq('user_id', user.id)

            console.log(`[webhook] Upgraded all surveys for user ${user.id} to unlimited`)
          } else {
            // For per-event: increment premium credits (don't upgrade existing surveys)
            const { data: currentProfile } = await supabaseAdmin
              .from('user_profiles')
              .select('premium_credits')
              .eq('id', user.id)
              .maybeSingle()

            const currentCredits = currentProfile?.premium_credits || 0

            await supabaseAdmin
              .from('user_profiles')
              .update({ premium_credits: currentCredits + 1 })
              .eq('id', user.id)

            console.log(`[webhook] Added 1 premium credit to user ${user.id} (total: ${currentCredits + 1})`)
          }

          console.log(`[webhook] Upgraded user ${user.id} to ${planType}`)
        }

        // Send both emails in parallel
        await Promise.all([
          sendWelcomeEmail(customerEmail, session.customer_details?.name || undefined),
          sendPaymentConfirmationEmail(customerEmail, plan, amount),
        ])

        console.log(`[webhook] Sent welcome + confirmation to ${customerEmail} (${plan})`)
      }
    }

    // Handle subscription updates (renewals, cancellations)
    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as any // Stripe subscription object

      // Find user by customer ID
      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .eq('stripe_customer_id', subscription.customer as string)
        .single()

      if (profile) {
        if (event.type === 'customer.subscription.deleted' || subscription.status === 'canceled') {
          // Downgrade to free
          await supabaseAdmin
            .from('user_profiles')
            .update({ plan_type: 'free', updated_at: new Date().toISOString() })
            .eq('id', profile.id)

          await supabaseAdmin
            .from('subscriptions')
            .update({ status: 'canceled', updated_at: new Date().toISOString() })
            .eq('user_id', profile.id)

          // Set response limits back to 25
          await supabaseAdmin
            .from('surveys')
            .update({ max_responses: 25 })
            .eq('user_id', profile.id)

          console.log(`[webhook] Downgraded user ${profile.id} to free`)
        } else {
          // Update subscription status
          await supabaseAdmin
            .from('subscriptions')
            .update({
              status: subscription.status,
              current_period_start: new Date((subscription.current_period_start as number) * 1000).toISOString(),
              current_period_end: new Date((subscription.current_period_end as number) * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end || false,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscription.id)

          console.log(`[webhook] Updated subscription ${subscription.id} status: ${subscription.status}`)
        }
      }
    }
  } catch (err) {
    console.error('[webhook] Processing failed:', err)
    // Don't return error — Stripe would retry unnecessarily
  }

  return NextResponse.json({ received: true })
}
