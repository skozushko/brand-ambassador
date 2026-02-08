"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-key"
)

const CONTINENTS = [
  "North America",
  "South America",
  "Europe",
  "Africa",
  "Asia",
  "Oceania",
]

export default function RequestAccessPage() {
  const [companyName, setCompanyName] = useState("")
  const [contactName, setContactName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [selectedContinents, setSelectedContinents] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  const toggleContinent = (c: string) => {
    setSelectedContinents((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    )
  }

  const submit = async () => {
    if (!companyName || !contactName || !email) {
      setErrorMsg("Please fill in company name, contact name, and email.")
      return
    }
    setStatus("submitting")
    setErrorMsg("")

    const { error } = await supabase.from("agency_requests").insert({
      company_name: companyName,
      contact_name: contactName,
      email,
      phone: phone || null,
      continents_of_interest: selectedContinents,
      notes: notes || null,
    })

    if (error) {
      setStatus("error")
      setErrorMsg(error.message)
    } else {
      setStatus("success")
    }
  }

  if (status === "success") {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-2xl mx-auto p-8 py-16 text-center">
          <div className="text-5xl mb-4">✓</div>
          <h1 className="text-3xl font-bold mb-3">Request Received</h1>
          <p className="text-gray-600 mb-6">
            Thank you for your interest. We'll review your request and be in touch shortly.
          </p>
          <Link href="/" className="underline text-sm">
            ← Back to home
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-2xl mx-auto p-8 py-16">
        <Link href="/" className="text-sm underline">
          ← Back to home
        </Link>

        <h1 className="mt-6 text-3xl font-bold">Request Agency Access</h1>
        <p className="mt-2 text-gray-600">
          Fill out this form to request access to our brand ambassador directory.
          We review all applications and will follow up via email.
        </p>

        <div className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-medium">Company Name *</label>
            <input
              className="mt-1 w-full border rounded-md p-2"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Your Name *</label>
            <input
              className="mt-1 w-full border rounded-md p-2"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Email Address *</label>
            <input
              type="email"
              className="mt-1 w-full border rounded-md p-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Phone (optional)</label>
            <input
              type="tel"
              className="mt-1 w-full border rounded-md p-2"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Which regions are you interested in?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CONTINENTS.map((c) => (
                <label key={c} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedContinents.includes(c)}
                    onChange={() => toggleContinent(c)}
                  />
                  <span className="text-sm">{c}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">
              Tell us about your agency (optional)
            </label>
            <textarea
              className="mt-1 w-full border rounded-md p-2 h-28 resize-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What types of ambassadors are you looking for? How will you use the directory?"
            />
          </div>

          {errorMsg && <div className="text-sm text-red-600">{errorMsg}</div>}

          <button
            className="w-full bg-black text-white rounded-md py-3 font-semibold disabled:opacity-50"
            onClick={submit}
            disabled={status === "submitting"}
          >
            {status === "submitting" ? "Submitting…" : "Submit Request"}
          </button>
        </div>
      </div>
    </main>
  )
}
