import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

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
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id

        if (!userId) break

        // Get subscription details to extract region names from price metadata
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string, {
          expand: ["items.data.price.product"],
        })

        const regions: string[] = []
        for (const item of subscription.items.data) {
          const product = item.price.product as Stripe.Product
          if (product.metadata?.region) {
            regions.push(product.metadata.region)
          }
        }

        // Create or update subscription record
        await supabaseAdmin.from("agency_subscriptions").upsert({
          agency_user_id: userId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          status: "active",
          subscribed_continents: regions,
          updated_at: new Date().toISOString(),
        })
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Get regions from subscription items
        const subWithDetails = await stripe.subscriptions.retrieve(subscription.id, {
          expand: ["items.data.price.product"],
        })

        const regions: string[] = []
        for (const item of subWithDetails.items.data) {
          const product = item.price.product as Stripe.Product
          if (product.metadata?.region) {
            regions.push(product.metadata.region)
          }
        }

        await supabaseAdmin
          .from("agency_subscriptions")
          .update({
            status: subscription.status === "active" ? "active" : "inactive",
            subscribed_continents: regions,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        await supabaseAdmin
          .from("agency_subscriptions")
          .update({
            status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id)
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const subId = (invoice as any).subscription as string | null
        if (subId) {
          await supabaseAdmin
            .from("agency_subscriptions")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subId)
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("Webhook handler error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
