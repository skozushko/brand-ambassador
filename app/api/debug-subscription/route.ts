import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getServerSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const serverSupabase = await getServerSupabase()
  const {
    data: { user },
    error: userError,
  } = await serverSupabase.auth.getUser()

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 })
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: rows, error } = await supabaseAdmin
    .from("agency_subscriptions")
    .select("id, agency_user_id, status, stripe_customer_id, stripe_subscription_id, subscribed_continents, updated_at")
    .eq("agency_user_id", user.id)
    .order("updated_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    user: { id: user.id, email: user.email },
    rows: rows ?? [],
  })
}
