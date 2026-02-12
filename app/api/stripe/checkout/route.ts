import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getServerSupabase } from "@/lib/supabase-server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { priceIds } = await request.json()

    if (!priceIds || !Array.isArray(priceIds) || priceIds.length === 0) {
      return NextResponse.json({ error: "Invalid price IDs" }, { status: 400 })
    }

    // Get authenticated user
    const supabase = await getServerSupabase()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      mode: "subscription",
      line_items: priceIds.map((priceId: string) => ({
        price: priceId,
        quantity: 1,
      })),
      success_url: `${siteUrl}/directory?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/subscribe?canceled=true`,
      metadata: {
        user_id: user.id,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("Stripe checkout error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
