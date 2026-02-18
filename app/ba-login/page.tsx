"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"
import Link from "next/link"
import { getBrowserSupabase } from "@/lib/supabase"

const supabase = getBrowserSupabase()

export default function BALoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const signInWithPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("")
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (error) {
      setStatus(error.message)
      return
    }

    await fetch("/api/auth/set-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: data.session!.access_token,
        refresh_token: data.session!.refresh_token,
      }),
    })

    window.location.href = "/my-profile"
  }

  const sendMagicLink = async () => {
    setStatus("")
    if (!email) {
      setStatus("Please enter your email first.")
      return
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/ba-auth/callback` },
    })
    setStatus(error ? error.message : "Magic link sent! Check your email.")
  }

  const sendPasswordReset = async () => {
    setStatus("")
    if (!email) {
      setStatus("Please enter your email first.")
      return
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    })
    setStatus(error ? error.message : "Password reset email sent! Check your inbox.")
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Ambassador Login</h1>
          <p className="text-gray-600 mt-2">Log in to view and update your profile</p>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-sm">
          <form onSubmit={signInWithPassword} className="space-y-4">
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
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white font-semibold py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <button
              type="button"
              className="text-sm underline text-gray-500 hover:text-gray-700"
              onClick={sendPasswordReset}
            >
              Forgot password?
            </button>
          </form>

          <div className="border-t mt-6 pt-6">
            <button
              type="button"
              className="w-full border rounded-lg px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
              onClick={sendMagicLink}
            >
              Send magic link instead
            </button>
          </div>

          {status && (
            <p className="mt-4 text-sm text-gray-700">{status}</p>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            New ambassador?{" "}
            <Link href="/ba-register" className="underline hover:text-gray-700">
              Create an account
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
