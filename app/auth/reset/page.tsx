"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getBrowserSupabase } from "@/lib/supabase"

const supabase = getBrowserSupabase()

export default function Page() {
  const router = useRouter()
  const [pw1, setPw1] = useState("")
  const [pw2, setPw2] = useState("")
  const [msg, setMsg] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // If user arrived here via recovery link, Supabase will set a session.
    // We'll just check that we have one.
    const check = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        setMsg("No active recovery session found. Please request a new password reset email.")
      }
      setReady(true)
    }
    check()
  }, [])

  const setPassword = async () => {
    setMsg(null)

    if (pw1.length < 8) {
      setMsg("Password must be at least 8 characters.")
      return
    }
    if (pw1 !== pw2) {
      setMsg("Passwords do not match.")
      return
    }

    const { error } = await supabase.auth.updateUser({ password: pw1 })
    if (error) {
      setMsg(error.message)
      return
    }

    setMsg("Password updated! Redirecting to login…")
    setTimeout(() => router.replace("/login"), 900)
  }

  if (!ready) {
    return (
      <main className="p-8">
        <div className="text-sm text-gray-700">Loading…</div>
      </main>
    )
  }

  return (
    <main className="p-8 max-w-lg">
      <Link className="underline" href="/login">← Back to Login</Link>

      <h1 className="mt-6 text-2xl font-bold">Set a new password</h1>

      <div className="mt-4 border rounded-lg p-4 space-y-3">
        <div>
          <label className="block text-sm font-medium">New password</label>
          <input
            className="mt-1 w-full border rounded-md p-2"
            type="password"
            value={pw1}
            onChange={(e) => setPw1(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Confirm new password</label>
          <input
            className="mt-1 w-full border rounded-md p-2"
            type="password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
          />
        </div>

        <button className="bg-black text-white rounded-md px-4 py-2" onClick={setPassword}>
          Update password
        </button>

        {msg && <div className="text-sm mt-2">{msg}</div>}
      </div>
    </main>
  )
}