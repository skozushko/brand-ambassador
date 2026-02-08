"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginPage() {
  const [email, setEmail] = useState("skozushko@gmail.com")
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState<string>("")

  const [sessionEmail, setSessionEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const refresh = async () => {
    const { data } = await supabase.auth.getSession()
    setSessionEmail(data.session?.user?.email ?? null)
    setUserId(data.session?.user?.id ?? null)
  }

  useEffect(() => {
    refresh()
  }, [])

  const signInWithPassword = async () => {
    setStatus("")
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setStatus(error.message)
    } else {
      setStatus("Signed in! Redirecting...")
      await refresh()
      // Redirect to directory after successful login
      window.location.href = "/directory"
    }
  }

  const sendMagicLink = async () => {
    setStatus("")
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setStatus(error ? error.message : "Magic link sent! Check your email.")
  }

  const sendPasswordReset = async () => {
    setStatus("")
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    })
    setStatus(error ? error.message : "Password reset email sent! Check your inbox.")
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setStatus("Signed out.")
    await refresh()
  }

  return (
    <main className="p-8 max-w-lg">
      <Link className="underline" href="/directory">
        ← Back to Directory
      </Link>

      <h1 className="mt-6 text-2xl font-bold">Agency Login</h1>

      {sessionEmail ? (
        <div className="mt-4 border rounded-lg p-4">
          <div className="text-sm">
            Logged in as <span className="font-medium">{sessionEmail}</span>
          </div>
          <div className="text-xs text-gray-600 mt-1">
            User ID: {userId}
          </div>

          <button
            className="mt-4 bg-black text-white rounded-md px-4 py-2"
            onClick={signOut}
          >
            Sign out
          </button>

          {status && <div className="mt-3 text-sm">{status}</div>}
        </div>
      ) : (
        <div className="mt-4 border rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              className="mt-1 w-full border rounded-md p-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              className="mt-1 w-full border rounded-md p-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              className="mt-3 bg-black text-white rounded-md px-4 py-2"
              onClick={signInWithPassword}
            >
              Sign in with password
            </button>

            <button
              type="button"
              className="mt-2 underline text-sm"
              onClick={sendPasswordReset}
            >
              Forgot password?
            </button>
          </div>

          <div className="border-t pt-4">
            <button
              className="border rounded-md px-4 py-2"
              onClick={sendMagicLink}
            >
              Send magic link
            </button>
          </div>

          {status && <div className="text-sm">{status}</div>}
        </div>
      )}
    </main>
  )
}