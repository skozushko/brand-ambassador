import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"
import { extractRegions, normalizeStatus, saveSubscriptionForUser } from "@/lib/stripe-subscriptions"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Use service role for webhook (needs to bypass RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get("stripe-signature")!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("Webhook signature verification failed:", message)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id

        if (!userId || typeof session.subscription !== "string" || typeof session.customer !== "string") break

        const { status, regions } = await extractRegions(session.subscription)
        await saveSubscriptionForUser({
          userId,
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
          status: normalizeStatus(status),
          regions,
        })
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const { regions } = await extractRegions(subscription.id)

        const { error: updateError } = await supabaseAdmin
          .from("agency_subscriptions")
          .update({
            status: normalizeStatus(subscription.status),
            subscribed_continents: regions,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId)

        if (updateError) throw updateError
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const { error: cancelError } = await supabaseAdmin
          .from("agency_subscriptions")
          .update({
            status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id)
        if (cancelError) throw cancelError
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const subRef = (invoice as unknown as Record<string, unknown>).subscription
        const subId = typeof subRef === "string" ? subRef : null
        if (subId) {
          const { error: paymentFailedError } = await supabaseAdmin
            .from("agency_subscriptions")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subId)
          if (paymentFailedError) throw paymentFailedError
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("Webhook handler error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
