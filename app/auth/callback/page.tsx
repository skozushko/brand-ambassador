"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getBrowserSupabase } from "@/lib/supabase"

const supabase = getBrowserSupabase()

export default function Page() {
  const router = useRouter()
  const [msg, setMsg] = useState("Signing you in…")

  useEffect(() => {
    const run = async () => {
      try {
        const url = new URL(window.location.href)
        const code = url.searchParams.get("code")

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            setMsg(`Login failed: ${error.message}`)
            return
          }
        }

        const { data } = await supabase.auth.getSession()
        if (!data.session) {
          setMsg("No session found. Please request a new magic link.")
          return
        }

        router.replace("/directory")
      } catch (e: any) {
        setMsg(`Login failed: ${e?.message ?? "Unknown error"}`)
      }
    }

    run()
  }, [router])

  return (
    <main className="p-8">
      <h1 className="text-xl font-semibold">Auth Callback</h1>
      <p className="mt-3 text-sm text-gray-700">{msg}</p>
    </main>
  )
}