"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"

type Option = { id: number; name: string }

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function SignupPage() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    instagram_handle: "",
    city: "",
    state_region: "",
    country: "",
    timezone: "",
    experience_level: "new",
    bio: "",
    willing_to_travel: false,
    has_vehicle: false,
    availability_status: "available",
    can_work_weekends: true,
    can_work_nights: true,
  })

  const [roles, setRoles] = useState<Option[]>([])
  const [skills, setSkills] = useState<Option[]>([])
  const [languages, setLanguages] = useState<Option[]>([])

  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([])
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([])
  const [selectedLanguageIds, setSelectedLanguageIds] = useState<number[]>([])

  const [status, setStatus] = useState<{ type: "idle" | "ok" | "error"; msg?: string }>({
    type: "idle",
  })
  const [loading, setLoading] = useState(false)

  const update = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }))

  useEffect(() => {
    const load = async () => {
      const [{ data: r, error: er }, { data: s, error: es }, { data: l, error: el }] =
        await Promise.all([
          supabase.from("roles").select("id,name").order("name"),
          supabase.from("skills").select("id,name").order("name"),
          supabase.from("languages").select("id,name").order("name"),
        ])

      if (er || es || el) {
        setStatus({
          type: "error",
          msg:
            "Could not load roles/skills/languages. Check Supabase RLS select policies on roles/skills/languages.",
        })
        return
      }

      setRoles((r as Option[]) ?? [])
      setSkills((s as Option[]) ?? [])
      setLanguages((l as Option[]) ?? [])
    }

    load()
  }, [])

  const toggle = (arr: number[], id: number, checked: boolean) =>
    checked ? [...arr, id] : arr.filter((x) => x !== id)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus({ type: "idle" })

    const payload: any = {
      ...form,
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      instagram_handle: form.instagram_handle.replace(/^@/, "").trim() || null,
      phone_number: form.phone_number.trim() || null,
      city: form.city.trim() || null,
      state_region: form.state_region.trim() || null,
      country: form.country.trim() || null,
      timezone: form.timezone.trim() || null,
      bio: form.bio.trim() || null,
      last_active_at: new Date().toISOString(),
    }

    const { data: inserted, error: insertError } = await supabase
      .from("ambassadors")
      .insert([payload])
      .select("id")
      .single()

    if (insertError || !inserted?.id) {
      setStatus({ type: "error", msg: insertError?.message ?? "Insert failed" })
      setLoading(false)
      return
    }

    const ambassadorId = inserted.id as string

    const joins: Promise<any>[] = []

    if (selectedRoleIds.length) {
      joins.push(
        Promise.resolve(
          supabase
            .from("ambassador_roles")
            .insert(selectedRoleIds.map((role_id) => ({ ambassador_id: ambassadorId, role_id })))
        )
      )
    }
    if (selectedSkillIds.length) {
      joins.push(
        Promise.resolve(
          supabase
            .from("ambassador_skills")
            .insert(selectedSkillIds.map((skill_id) => ({ ambassador_id: ambassadorId, skill_id })))
        )
      )
    }
    if (selectedLanguageIds.length) {
      joins.push(
        Promise.resolve(
          supabase
            .from("ambassador_languages")
            .insert(
              selectedLanguageIds.map((language_id) => ({ ambassador_id: ambassadorId, language_id }))
            )
        )
      )
    }

    const results = await Promise.all(joins)
    const joinError = results.find((r) => r?.error)?.error

    if (joinError) {
      setStatus({
        type: "error",
        msg:
          "Ambassador saved, but roles/skills/languages failed to save: " +
          joinError.message +
          ". Check insert policies on join tables.",
      })
      setLoading(false)
      return
    }

    setStatus({ type: "ok", msg: "Submitted! View it in the Directory." })
    setForm({
      full_name: "",
      email: "",
      phone_number: "",
      instagram_handle: "",
      city: "",
      state_region: "",
      country: "",
      timezone: "",
      experience_level: "new",
      bio: "",
      willing_to_travel: false,
      has_vehicle: false,
      availability_status: "available",
      can_work_weekends: true,
      can_work_nights: true,
    })
    setSelectedRoleIds([])
    setSelectedSkillIds([])
    setSelectedLanguageIds([])
    setLoading(false)
  }

  return (
    <main className="p-8 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ambassador Signup</h1>
        <div className="flex gap-3">
          <Link className="underline" href="/">
            Home
          </Link>
          <Link className="underline" href="/directory">
            Directory
          </Link>
        </div>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">Full name</label>
            <input
              className="mt-1 w-full border rounded-md p-2"
              value={form.full_name}
              onChange={(e) => update("full_name", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              className="mt-1 w-full border rounded-md p-2"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Phone number</label>
            <input
              className="mt-1 w-full border rounded-md p-2"
              value={form.phone_number}
              onChange={(e) => update("phone_number", e.target.value)}
              placeholder="+1 212 555 0123"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Instagram</label>
            <input
              className="mt-1 w-full border rounded-md p-2"
              value={form.instagram_handle}
              onChange={(e) => update("instagram_handle", e.target.value)}
              placeholder="@handle"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">City</label>
            <input
              className="mt-1 w-full border rounded-md p-2"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">State / Region</label>
            <input
              className="mt-1 w-full border rounded-md p-2"
              value={form.state_region}
              onChange={(e) => update("state_region", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Country</label>
            <input
              className="mt-1 w-full border rounded-md p-2"
              value={form.country}
              onChange={(e) => update("country", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Timezone</label>
            <input
              className="mt-1 w-full border rounded-md p-2"
              value={form.timezone}
              onChange={(e) => update("timezone", e.target.value)}
              placeholder="America/New_York"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">Experience level</label>
            <select
              className="mt-1 w-full border rounded-md p-2"
              value={form.experience_level}
              onChange={(e) => update("experience_level", e.target.value)}
            >
              <option value="new">New</option>
              <option value="experienced">Experienced</option>
              <option value="elite">Elite</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Availability status</label>
            <select
              className="mt-1 w-full border rounded-md p-2"
              value={form.availability_status}
              onChange={(e) => update("availability_status", e.target.value)}
            >
              <option value="available">Available</option>
              <option value="limited">Limited</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.willing_to_travel}
              onChange={(e) => update("willing_to_travel", e.target.checked)}
            />
            Willing to travel
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.has_vehicle}
              onChange={(e) => update("has_vehicle", e.target.checked)}
            />
            Has vehicle
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.can_work_weekends}
              onChange={(e) => update("can_work_weekends", e.target.checked)}
            />
            Can work weekends
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.can_work_nights}
              onChange={(e) => update("can_work_nights", e.target.checked)}
            />
            Can work nights
          </label>
        </div>

        <div className="border rounded-lg p-4">
          <div className="font-medium">Roles</div>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {roles.map((opt) => (
              <label key={opt.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedRoleIds.includes(opt.id)}
                  onChange={(e) =>
                    setSelectedRoleIds((prev) => toggle(prev, opt.id, e.target.checked))
                  }
                />
                {opt.name}
              </label>
            ))}
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="font-medium">Skills</div>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {skills.map((opt) => (
              <label key={opt.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedSkillIds.includes(opt.id)}
                  onChange={(e) =>
                    setSelectedSkillIds((prev) => toggle(prev, opt.id, e.target.checked))
                  }
                />
                {opt.name}
              </label>
            ))}
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="font-medium">Languages</div>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {languages.map((opt) => (
              <label key={opt.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedLanguageIds.includes(opt.id)}
                  onChange={(e) =>
                    setSelectedLanguageIds((prev) => toggle(prev, opt.id, e.target.checked))
                  }
                />
                {opt.name}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Bio</label>
          <textarea
            className="mt-1 w-full border rounded-md p-2"
            rows={4}
            value={form.bio}
            onChange={(e) => update("bio", e.target.value)}
          />
        </div>

        <button
          disabled={loading}
          className="bg-black text-white rounded-md px-4 py-2 disabled:opacity-60"
          type="submit"
        >
          {loading ? "Submitting..." : "Submit"}
        </button>

        {status.type === "ok" && <div className="text-green-700">{status.msg}</div>}
        {status.type === "error" && <div className="text-red-700">{status.msg}</div>}
      </form>
    </main>
  )
}