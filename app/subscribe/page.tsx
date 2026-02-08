"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getBrowserSupabase } from "@/lib/supabase"

const supabase = getBrowserSupabase()

const CONTINENT_PLANS = [
  { name: "North America", price: 500 },
  { name: "South America", price: 500 },
  { name: "Europe", price: 500 },
  { name: "Africa", price: 500 },
  { name: "Asia", price: 500 },
  { name: "Oceania", price: 500 },
]

const WORLD_PLAN = { name: "World (All Regions)", price: 1000 }

export default function SubscribePage() {
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string[]>([])
  const [worldSelected, setWorldSelected] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessionEmail(data.session?.user?.email ?? null)
      setLoading(false)
    })
  }, [])

  const toggleContinent = (name: string) => {
    if (worldSelected) return
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    )
  }

  const toggleWorld = () => {
    setWorldSelected((prev) => !prev)
    setSelected([])
  }

  const total = worldSelected
    ? WORLD_PLAN.price
    : selected.length * 500

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-gray-600">Loading…</div>
      </main>
    )
  }

  if (!sessionEmail) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-3">Login Required</h1>
          <p className="text-gray-600 mb-6">Please log in to subscribe.</p>
          <Link href="/login" className="bg-black text-white rounded-md px-6 py-3 font-semibold">
            Log In
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-3xl mx-auto p-8 py-16">
        <Link href="/directory" className="text-sm underline">
          ← Back to Directory
        </Link>

        <h1 className="mt-6 text-3xl font-bold">Choose Your Plan</h1>
        <p className="mt-2 text-gray-600">
          Subscribe to access brand ambassadors by region. Mix and match continents or get the world plan for full access.
        </p>

        <div className="mt-8 grid gap-3">
          {CONTINENT_PLANS.map((plan) => (
            <label
              key={plan.name}
              className={`flex items-center justify-between border rounded-lg p-4 cursor-pointer transition-colors ${
                worldSelected
                  ? "opacity-40 cursor-not-allowed"
                  : selected.includes(plan.name)
                  ? "border-black bg-gray-50"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selected.includes(plan.name)}
                  onChange={() => toggleContinent(plan.name)}
                  disabled={worldSelected}
                />
                <span className="font-medium">{plan.name}</span>
              </div>
              <span className="text-gray-600">${plan.price.toLocaleString()}/month</span>
            </label>
          ))}

          <div className="border-t my-2" />

          <label
            className={`flex items-center justify-between border-2 rounded-lg p-4 cursor-pointer transition-colors ${
              worldSelected ? "border-black bg-gray-50" : "hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={worldSelected}
                onChange={toggleWorld}
              />
              <div>
                <span className="font-semibold">{WORLD_PLAN.name}</span>
                <div className="text-sm text-gray-500">Access to all 6 regions</div>
              </div>
            </div>
            <span className="text-gray-600">${WORLD_PLAN.price.toLocaleString()}/month</span>
          </label>
        </div>

        {/* Total */}
        <div className="mt-6 flex items-center justify-between border-t pt-4">
          <div className="text-lg font-semibold">
            Total: ${total.toLocaleString()}/month
          </div>
          <button
            className="bg-black text-white rounded-md px-6 py-3 font-semibold disabled:opacity-40"
            disabled={total === 0}
            onClick={() => alert("Stripe checkout coming soon — payment processing is being set up.")}
          >
            Subscribe
          </button>
        </div>

        {total === 0 && (
          <p className="text-sm text-gray-500 mt-2">Select at least one region to continue.</p>
        )}
      </div>
    </main>
  )
}
