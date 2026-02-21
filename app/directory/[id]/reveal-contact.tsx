"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getBrowserSupabase } from "@/lib/supabase"

const supabase = getBrowserSupabase()

export default function RevealContact({ ambassadorId }: { ambassadorId: string }) {
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)
  const [quota, setQuota] = useState<{ used: number; remaining: number; monthly_limit: number } | null>(null)
  const [contact, setContact] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession()
      setSessionEmail(data.session?.user?.email ?? null)

      if (data.session) {
        const { data: qs } = await supabase.rpc("quota_status")
        if (qs && qs[0]) {
          setQuota({ used: qs[0].used, remaining: qs[0].remaining, monthly_limit: qs[0].monthly_limit })
        }
      }
    }
    load()
  }, [])

  const reveal = async () => {
    setLoading(true)
    setErr(null)

    const { data: sess } = await supabase.auth.getSession()
    if (!sess.session) {
      setErr("Please log in to reveal contact.")
      setLoading(false)
      return
    }

    const { data, error } = await supabase.rpc("reveal_contact", { p_ambassador_id: ambassadorId })

    if (error) {
      const msg =
        error.message.includes("no_active_subscription")
          ? "Your account doesn't have an active subscription yet."
          : error.message.includes("quota_exceeded")
          ? "You've hit your monthly contact-reveal limit."
          : error.message
      setErr(msg)
      setLoading(false)
      return
    }

    const row = Array.isArray(data) ? data[0] : data
    if (!row) {
      setErr("No contact data returned. The reveal_contact RPC may need to be checked.")
      setLoading(false)
      return
    }
    setContact(row)

    const { data: qs } = await supabase.rpc("quota_status")
    if (qs && qs[0]) {
      setQuota({ used: qs[0].used, remaining: qs[0].remaining, monthly_limit: qs[0].monthly_limit })
    }

    setLoading(false)
  }

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="font-medium">Contact</div>
          {sessionEmail ? (
            <div className="text-xs text-gray-600">Logged in as {sessionEmail}</div>
          ) : (
            <div className="text-xs text-gray-600">
              <Link className="underline" href="/login">Log in</Link> to reveal contact.
            </div>
          )}
        </div>

        <button
          className="bg-black text-white rounded-md px-4 py-2 disabled:opacity-60"
          disabled={loading}
          onClick={reveal}
          type="button"
        >
          {loading ? "Revealing..." : "Reveal contact"}
        </button>
      </div>

      {quota && (
        <div className="mt-3 text-sm text-gray-700">
          Monthly reveals: {quota.used}/{quota.monthly_limit} • Remaining: {quota.remaining}
        </div>
      )}

      {err && <div className="mt-3 text-sm text-red-700">{err}</div>}

      {contact && (
        <div className="mt-4 text-sm">
          <div>Email: {contact.email ?? "—"}</div>
          <div>Phone: {contact.phone_number ?? "—"}</div>
          <div>Instagram: {contact.instagram_handle ? `@${contact.instagram_handle}` : "—"}</div>
        </div>
      )}
    </div>
  )
}