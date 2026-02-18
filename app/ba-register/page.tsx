"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getBrowserSupabase } from "@/lib/supabase"

const supabase = getBrowserSupabase()

export default function BARegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [status, setStatus] = useState<{ type: "idle" | "ok" | "error"; msg?: string }>({ type: "idle" })
  const [loading, setLoading] = useState(false)

  // If already logged in, send them where they belong
  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) return
      const { data: existing } = await supabase
        .from("ambassadors")
        .select("id")
        .eq("user_id", data.session.user.id)
        .maybeSingle()
      window.location.href = existing ? "/my-profile" : "/signup"
    }
    check()
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus({ type: "idle" })

    if (password.length < 8) {
      setStatus({ type: "error", msg: "Password must be at least 8 characters." })
      return
    }
    if (password !== confirm) {
      setStatus({ type: "error", msg: "Passwords do not match." })
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)

    if (error) {
      const msg = error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("already exists")
        ? "An account with this email already exists. Please log in instead."
        : error.message
      setStatus({ type: "error", msg })
      return
    }

    // Redirect to profile form — session is now active
    window.location.href = "/signup"
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Create Your Account</h1>
          <p className="text-gray-600 mt-2">Step 1 of 2 — then fill in your ambassador profile</p>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-sm">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                required
                className="mt-1 w-full border rounded-md p-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Password</label>
              <input
                type="password"
                required
                className="mt-1 w-full border rounded-md p-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Confirm Password</label>
              <input
                type="password"
                required
                className="mt-1 w-full border rounded-md p-2"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white font-semibold py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>

            {status.type === "error" && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <p className="text-red-700 font-medium text-sm">{status.msg}</p>
              </div>
            )}
            {status.type === "ok" && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                <p className="text-green-700 font-medium text-sm">{status.msg}</p>
              </div>
            )}
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link href="/ba-login" className="underline hover:text-gray-700">
              Log in here
            </Link>
          </p>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link href="/" className="underline hover:text-gray-700">
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  )
}
