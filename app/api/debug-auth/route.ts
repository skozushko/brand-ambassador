import { NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export async function GET() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()

  const serverSupabase = await getServerSupabase()
  const { data: { user }, error } = await serverSupabase.auth.getUser()

  return NextResponse.json({
    cookieCount: allCookies.length,
    cookieNames: allCookies.map((c) => c.name),
    user: user ? { id: user.id, email: user.email } : null,
    error: error?.message ?? null,
  })
}
