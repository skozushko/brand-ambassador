"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { getBrowserSupabase } from "@/lib/supabase"
import { COUNTRIES, US_STATES, CANADA_PROVINCES } from "@/lib/geo-data"

type Option = { id: number; name: string }

const supabase = getBrowserSupabase()

const HEADSHOT_MAX_MB = 5
const VIDEO_MAX_MB = 100
const VIDEO_MAX_SECONDS = 30

function fileExt(file: File) {
  return file.name.split(".").pop()?.toLowerCase() ?? "bin"
}

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

  // File upload state
  const [headshotFile, setHeadshotFile] = useState<File | null>(null)
  const [headshotPreview, setHeadshotPreview] = useState<string | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [uploadStep, setUploadStep] = useState("")
  const [uploadProgress, setUploadProgress] = useState(0)

  const headshotRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)

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

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (headshotPreview) URL.revokeObjectURL(headshotPreview)
      if (videoPreview) URL.revokeObjectURL(videoPreview)
    }
  }, [headshotPreview, videoPreview])

  const toggle = (arr: number[], id: number, checked: boolean) =>
    checked ? [...arr, id] : arr.filter((x) => x !== id)

  function handleHeadshotChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const allowed = ["image/jpeg", "image/png", "image/webp"]
    if (!allowed.includes(file.type)) {
      setStatus({ type: "error", msg: "Headshot must be a JPEG, PNG, or WebP image." })
      e.target.value = ""
      return
    }
    if (file.size > HEADSHOT_MAX_MB * 1024 * 1024) {
      setStatus({ type: "error", msg: `Headshot must be under ${HEADSHOT_MAX_MB} MB.` })
      e.target.value = ""
      return
    }

    if (headshotPreview) URL.revokeObjectURL(headshotPreview)
    setHeadshotFile(file)
    setHeadshotPreview(URL.createObjectURL(file))
    setStatus({ type: "idle" })
  }

  function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const allowed = ["video/mp4", "video/webm", "video/quicktime"]
    if (!allowed.includes(file.type)) {
      setStatus({ type: "error", msg: "Video must be MP4, WebM, or MOV." })
      e.target.value = ""
      return
    }
    if (file.size > VIDEO_MAX_MB * 1024 * 1024) {
      setStatus({ type: "error", msg: `Video must be under ${VIDEO_MAX_MB} MB.` })
      e.target.value = ""
      return
    }

    // Validate duration via HTML5 video element
    const url = URL.createObjectURL(file)
    const vid = document.createElement("video")
    vid.preload = "metadata"
    vid.onloadedmetadata = () => {
      if (vid.duration > VIDEO_MAX_SECONDS) {
        setStatus({
          type: "error",
          msg: `Video must be ${VIDEO_MAX_SECONDS} seconds or shorter. Yours is ${Math.round(vid.duration)}s.`,
        })
        URL.revokeObjectURL(url)
        if (videoRef.current) videoRef.current.value = ""
        return
      }
      if (videoPreview) URL.revokeObjectURL(videoPreview)
      setVideoFile(file)
      setVideoPreview(url)
      setStatus({ type: "idle" })
    }
    vid.onerror = () => {
      setStatus({ type: "error", msg: "Could not read video file. Try a different format." })
      URL.revokeObjectURL(url)
      if (videoRef.current) videoRef.current.value = ""
    }
    vid.src = url
  }

  async function uploadFile(bucket: string, path: string, file: File) {
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    })
    if (error) throw new Error(`Upload to ${bucket} failed: ${error.message}`)

    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    if (!data?.publicUrl) {
      throw new Error(`Could not generate public URL for ${bucket}/${path}`)
    }
    return data.publicUrl
  }

  async function rollbackSignupMediaAndProfile(
    ambassadorId: string | null,
    headshotPath: string | null,
    videoPath: string | null
  ) {
    if (headshotPath) {
      await supabase.storage.from("headshots").remove([headshotPath])
    }
    if (videoPath) {
      await supabase.storage.from("intro-videos").remove([videoPath])
    }
    if (ambassadorId) {
      await supabase.from("ambassadors").delete().eq("id", ambassadorId)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus({ type: "idle" })
    setUploadStep("")
    setUploadProgress(0)

    // Validate files are selected
    if (!headshotFile) {
      setStatus({ type: "error", msg: "Please upload a headshot photo." })
      setLoading(false)
      return
    }
    if (!videoFile) {
      setStatus({ type: "error", msg: "Please upload an intro video." })
      setLoading(false)
      return
    }

    const ambassadorId = crypto.randomUUID()
    let headshotPath: string | null = null
    let videoPath: string | null = null

    try {
      // 1. Upload headshot
      setUploadStep("Uploading headshot...")
      setUploadProgress(15)
      headshotPath = `photos/${ambassadorId}.${fileExt(headshotFile)}`
      const headshotUrl = await uploadFile("headshots", headshotPath, headshotFile)

      // 2. Upload video
      setUploadStep("Uploading video... this can take up to a minute on slower connections.")
      setUploadProgress(35)
      videoPath = `videos/${ambassadorId}.${fileExt(videoFile)}`
      const videoUrl = await uploadFile("intro-videos", videoPath, videoFile)
      if (!headshotUrl || !videoUrl) {
        throw new Error("Missing media URL after upload. Please retry.")
      }
      setUploadProgress(80)

      // 3. Insert ambassador row with media URLs (required by DB NOT NULL constraints)
      setUploadStep("Saving your profile...")
      setUploadProgress(90)

      const payload: any = {
        id: ambassadorId,
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
        headshot_url: headshotUrl,
        video_url: videoUrl,
        last_active_at: new Date().toISOString(),
      }

      const { error: insertError } = await supabase.from("ambassadors").insert([payload])

      if (insertError) {
        await rollbackSignupMediaAndProfile(ambassadorId, headshotPath, videoPath)
        setStatus({ type: "error", msg: insertError.message })
        setLoading(false)
        setUploadStep("")
        setUploadProgress(0)
        return
      }
    } catch (err: unknown) {
      await rollbackSignupMediaAndProfile(ambassadorId, headshotPath, videoPath)
      const message = err instanceof Error ? err.message : "Upload failed"
      setStatus({ type: "error", msg: message })
      setLoading(false)
      setUploadStep("")
      setUploadProgress(0)
      return
    }

    // 5. Insert join tables (roles/skills/languages)
    setUploadStep("Saving roles & skills...")
    setUploadProgress(95)

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
      setUploadStep("")
      setUploadProgress(0)
      return
    }

    setUploadProgress(100)
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
    setHeadshotFile(null)
    setVideoFile(null)
    if (headshotPreview) URL.revokeObjectURL(headshotPreview)
    if (videoPreview) URL.revokeObjectURL(videoPreview)
    setHeadshotPreview(null)
    setVideoPreview(null)
    if (headshotRef.current) headshotRef.current.value = ""
    if (videoRef.current) videoRef.current.value = ""
    setLoading(false)
    setUploadStep("")
    setUploadProgress(0)
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
            <label className="block text-sm font-medium">Country</label>
            <select
              className="mt-1 w-full border rounded-md p-2"
              value={form.country}
              onChange={(e) => { update("country", e.target.value); update("state_region", "") }}
            >
              <option value="">Select country…</option>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">State / Province / Region</label>
            {form.country === "United States" ? (
              <select
                className="mt-1 w-full border rounded-md p-2"
                value={form.state_region}
                onChange={(e) => update("state_region", e.target.value)}
              >
                <option value="">Select state…</option>
                {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : form.country === "Canada" ? (
              <select
                className="mt-1 w-full border rounded-md p-2"
                value={form.state_region}
                onChange={(e) => update("state_region", e.target.value)}
              >
                <option value="">Select province…</option>
                {CANADA_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            ) : (
              <input
                className="mt-1 w-full border rounded-md p-2"
                value={form.state_region}
                onChange={(e) => update("state_region", e.target.value)}
                placeholder="State / province / region"
              />
            )}
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

        {/* Headshot upload */}
        <div className="border rounded-lg p-4">
          <div className="font-medium">Headshot Photo <span className="text-red-500">*</span></div>
          <p className="text-sm text-gray-500 mt-1">
            JPEG, PNG, or WebP. Max {HEADSHOT_MAX_MB} MB.
          </p>
          <input
            ref={headshotRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            onChange={handleHeadshotChange}
            className="mt-2 block text-sm"
          />
          {headshotPreview && (
            <img
              src={headshotPreview}
              alt="Headshot preview"
              className="mt-3 w-28 h-28 object-cover rounded-full border"
            />
          )}
        </div>

        {/* Video upload */}
        <div className="border rounded-lg p-4">
          <div className="font-medium">Intro Video <span className="text-red-500">*</span></div>
          <p className="text-sm text-gray-500 mt-1">
            MP4, WebM, or MOV. Max {VIDEO_MAX_SECONDS} seconds, {VIDEO_MAX_MB} MB.
          </p>
          <input
            ref={videoRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            required
            onChange={handleVideoChange}
            className="mt-2 block text-sm"
          />
          {videoPreview && (
            <video
              src={videoPreview}
              controls
              className="mt-3 w-full max-w-sm rounded-lg border"
            />
          )}
        </div>

        <button
          disabled={loading}
          className="bg-black text-white rounded-md px-4 py-2 disabled:opacity-60"
          type="submit"
        >
          {loading ? "Submitting..." : "Submit"}
        </button>

        {uploadStep && loading && (
          <div className="w-full max-w-md">
            <div className="text-sm text-gray-600">{uploadStep}</div>
            <div className="mt-2 h-2 w-full rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full bg-black transition-all duration-700"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <div className="mt-1 text-xs text-gray-500">{uploadProgress}%</div>
          </div>
        )}

        {status.type === "ok" && <div className="text-green-700">{status.msg}</div>}
        {status.type === "error" && <div className="text-red-700">{status.msg}</div>}
      </form>
    </main>
  )
}
