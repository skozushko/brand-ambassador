import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type AppSubscriptionStatus = "active" | "inactive" | "canceled" | "past_due"

export function normalizeStatus(status: Stripe.Subscription.Status): AppSubscriptionStatus {
  if (status === "active" || status === "trialing") return "active"
  if (status === "past_due") return "past_due"
  if (status === "canceled" || status === "unpaid" || status === "incomplete_expired") return "canceled"
  return "inactive"
}

export async function extractRegions(subscriptionId: string): Promise<{ status: Stripe.Subscription.Status; regions: string[] }> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price.product"],
  })

  const regions: string[] = []
  for (const item of subscription.items.data) {
    const product = item.price.product as Stripe.Product
    if (product.metadata?.region) regions.push(product.metadata.region)
  }

  return { status: subscription.status, regions }
}

export async function saveSubscriptionForUser(args: {
  userId: string
  stripeCustomerId: string
  stripeSubscriptionId: string
  status: AppSubscriptionStatus
  regions: string[]
}) {
  const now = new Date().toISOString()

  const { data: existingRows, error: existingError } = await supabaseAdmin
    .from("agency_subscriptions")
    .select("id")
    .eq("agency_user_id", args.userId)
    .order("updated_at", { ascending: false })
    .limit(1)

  if (existingError) throw existingError

  const existing = existingRows?.[0]
  if (existing?.id) {
    const { error: updateError } = await supabaseAdmin
      .from("agency_subscriptions")
      .update({
        stripe_customer_id: args.stripeCustomerId,
        stripe_subscription_id: args.stripeSubscriptionId,
        status: args.status,
        subscribed_continents: args.regions,
        updated_at: now,
      })
      .eq("id", existing.id)

    if (updateError) throw updateError
    return
  }

  const { error: insertError } = await supabaseAdmin.from("agency_subscriptions").insert({
    agency_user_id: args.userId,
    stripe_customer_id: args.stripeCustomerId,
    stripe_subscription_id: args.stripeSubscriptionId,
    status: args.status,
    subscribed_continents: args.regions,
    updated_at: now,
  })

  if (insertError) throw insertError
}

export async function syncSubscriptionFromCheckoutSession(sessionId: string, userId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  })

  if (session.mode !== "subscription") {
    throw new Error("Checkout session is not a subscription session")
  }

  const metadataUserId = session.metadata?.user_id
  if (metadataUserId && metadataUserId !== userId) {
    throw new Error("Checkout session user mismatch")
  }

  const customerRef = session.customer
  const stripeCustomerId = typeof customerRef === "string" ? customerRef : customerRef?.id ?? null
  if (!stripeCustomerId) throw new Error("Missing Stripe customer on checkout session")

  const subscriptionRef = session.subscription
  const stripeSubscriptionId =
    typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef?.id ?? null
  if (!stripeSubscriptionId) throw new Error("Missing Stripe subscription on checkout session")

  const { status, regions } = await extractRegions(stripeSubscriptionId)
  await saveSubscriptionForUser({
    userId,
    stripeCustomerId,
    stripeSubscriptionId,
    status: normalizeStatus(status),
    regions,
  })
}
