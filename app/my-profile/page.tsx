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

export default function MyProfilePage() {
  const [ambassadorId, setAmbassadorId] = useState<string | null>(null)
  const [authEmail, setAuthEmail] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadStep, setUploadStep] = useState("")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [status, setStatus] = useState<{ type: "idle" | "ok" | "error"; msg?: string }>({ type: "idle" })

  const [form, setForm] = useState({
    full_name: "",
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

  const [existingHeadshotUrl, setExistingHeadshotUrl] = useState<string | null>(null)
  const [existingVideoUrl, setExistingVideoUrl] = useState<string | null>(null)

  const [newHeadshotFile, setNewHeadshotFile] = useState<File | null>(null)
  const [newHeadshotPreview, setNewHeadshotPreview] = useState<string | null>(null)
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null)
  const [newVideoPreview, setNewVideoPreview] = useState<string | null>(null)

  const headshotRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)

  const update = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }))
  const toggle = (arr: number[], id: number, checked: boolean) =>
    checked ? [...arr, id] : arr.filter((x) => x !== id)

  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        window.location.href = "/ba-login"
        return
      }

      const userId = sessionData.session.user.id
      setAuthEmail(sessionData.session.user.email ?? "")

      const [
        { data: ambassador, error: ambErr },
        { data: r },
        { data: s },
        { data: l },
      ] = await Promise.all([
        supabase.from("ambassadors").select("*").eq("user_id", userId).single(),
        supabase.from("roles").select("id,name").order("name"),
        supabase.from("skills").select("id,name").order("name"),
        supabase.from("languages").select("id,name").order("name"),
      ])

      if (ambErr || !ambassador) {
        window.location.href = "/signup"
        return
      }

      setAmbassadorId(ambassador.id)
      setExistingHeadshotUrl(ambassador.headshot_url ?? null)
      setExistingVideoUrl(ambassador.video_url ?? null)
      setForm({
        full_name: ambassador.full_name ?? "",
        phone_number: ambassador.phone_number ?? "",
        instagram_handle: ambassador.instagram_handle ?? "",
        city: ambassador.city ?? "",
        state_region: ambassador.state_region ?? "",
        country: ambassador.country ?? "",
        timezone: ambassador.timezone ?? "",
        experience_level: ambassador.experience_level ?? "new",
        bio: ambassador.bio ?? "",
        willing_to_travel: ambassador.willing_to_travel ?? false,
        has_vehicle: ambassador.has_vehicle ?? false,
        availability_status: ambassador.availability_status ?? "available",
        can_work_weekends: ambassador.can_work_weekends ?? true,
        can_work_nights: ambassador.can_work_nights ?? true,
      })

      setRoles((r as Option[]) ?? [])
      setSkills((s as Option[]) ?? [])
      setLanguages((l as Option[]) ?? [])

      // Load existing join selections
      const [{ data: ar }, { data: as_ }, { data: al }] = await Promise.all([
        supabase.from("ambassador_roles").select("role_id").eq("ambassador_id", ambassador.id),
        supabase.from("ambassador_skills").select("skill_id").eq("ambassador_id", ambassador.id),
        supabase.from("ambassador_languages").select("language_id").eq("ambassador_id", ambassador.id),
      ])

      setSelectedRoleIds((ar ?? []).map((x: { role_id: number }) => x.role_id))
      setSelectedSkillIds((as_ ?? []).map((x: { skill_id: number }) => x.skill_id))
      setSelectedLanguageIds((al ?? []).map((x: { language_id: number }) => x.language_id))

      setLoading(false)
    }

    init()
  }, [])

  useEffect(() => {
    return () => {
      if (newHeadshotPreview) URL.revokeObjectURL(newHeadshotPreview)
      if (newVideoPreview) URL.revokeObjectURL(newVideoPreview)
    }
  }, [newHeadshotPreview, newVideoPreview])

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
    if (newHeadshotPreview) URL.revokeObjectURL(newHeadshotPreview)
    setNewHeadshotFile(file)
    setNewHeadshotPreview(URL.createObjectURL(file))
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
      if (newVideoPreview) URL.revokeObjectURL(newVideoPreview)
      setNewVideoFile(file)
      setNewVideoPreview(url)
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
      upsert: true,
    })
    if (error) throw new Error(`Upload to ${bucket} failed: ${error.message}`)
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    if (!data?.publicUrl) throw new Error(`Could not generate public URL for ${bucket}/${path}`)
    return data.publicUrl
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ambassadorId) return
    setSaving(true)
    setStatus({ type: "idle" })
    setUploadStep("")
    setUploadProgress(0)

    try {
      let headshotUrl: string | undefined
      let videoUrl: string | undefined

      if (newHeadshotFile) {
        setUploadStep("Uploading headshot...")
        setUploadProgress(20)
        headshotUrl = await uploadFile(
          "headshots",
          `photos/${ambassadorId}.${fileExt(newHeadshotFile)}`,
          newHeadshotFile
        )
        setUploadProgress(50)
      }

      if (newVideoFile) {
        setUploadStep("Uploading video... this can take up to a minute on slower connections.")
        setUploadProgress(55)
        videoUrl = await uploadFile(
          "intro-videos",
          `videos/${ambassadorId}.${fileExt(newVideoFile)}`,
          newVideoFile
        )
        setUploadProgress(80)
      }

      setUploadStep("Saving your profile...")
      setUploadProgress(85)

      const updatePayload: Record<string, unknown> = {
        ...form,
        full_name: form.full_name.trim(),
        email: authEmail.trim().toLowerCase(),
        instagram_handle: form.instagram_handle.replace(/^@/, "").trim() || null,
        phone_number: form.phone_number.trim() || null,
        city: form.city.trim() || null,
        state_region: form.state_region.trim() || null,
        country: form.country.trim() || null,
        timezone: form.timezone.trim() || null,
        bio: form.bio.trim() || null,
        last_active_at: new Date().toISOString(),
        ...(headshotUrl ? { headshot_url: headshotUrl } : {}),
        ...(videoUrl ? { video_url: videoUrl } : {}),
      }

      const { error: updateError } = await supabase
        .from("ambassadors")
        .update(updatePayload)
        .eq("id", ambassadorId)

      if (updateError) throw new Error(updateError.message)

      setUploadStep("Saving roles & skills...")
      setUploadProgress(92)

      await Promise.all([
        supabase.from("ambassador_roles").delete().eq("ambassador_id", ambassadorId),
        supabase.from("ambassador_skills").delete().eq("ambassador_id", ambassadorId),
        supabase.from("ambassador_languages").delete().eq("ambassador_id", ambassadorId),
      ])

      const joins: Promise<unknown>[] = []
      if (selectedRoleIds.length)
        joins.push(Promise.resolve(supabase.from("ambassador_roles").insert(selectedRoleIds.map((role_id) => ({ ambassador_id: ambassadorId, role_id })))))
      if (selectedSkillIds.length)
        joins.push(Promise.resolve(supabase.from("ambassador_skills").insert(selectedSkillIds.map((skill_id) => ({ ambassador_id: ambassadorId, skill_id })))))
      if (selectedLanguageIds.length)
        joins.push(Promise.resolve(supabase.from("ambassador_languages").insert(selectedLanguageIds.map((language_id) => ({ ambassador_id: ambassadorId, language_id })))))

      await Promise.all(joins)

      setUploadProgress(100)

      // Update local previews if new files were uploaded
      if (headshotUrl) setExistingHeadshotUrl(headshotUrl)
      if (videoUrl) setExistingVideoUrl(videoUrl)
      setNewHeadshotFile(null)
      setNewVideoFile(null)
      if (newHeadshotPreview) URL.revokeObjectURL(newHeadshotPreview)
      if (newVideoPreview) URL.revokeObjectURL(newVideoPreview)
      setNewHeadshotPreview(null)
      setNewVideoPreview(null)
      if (headshotRef.current) headshotRef.current.value = ""
      if (videoRef.current) videoRef.current.value = ""

      setStatus({ type: "ok", msg: "Profile updated!" })
    } catch (err: unknown) {
      setStatus({ type: "error", msg: err instanceof Error ? err.message : "Update failed." })
    } finally {
      setSaving(false)
      setUploadStep("")
      setUploadProgress(0)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  if (loading) {
    return (
      <main className="p-8">
        <p className="text-gray-500">Loading your profile…</p>
      </main>
    )
  }

  return (
    <main className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <div className="flex gap-3 items-center">
          <span className="text-sm text-gray-500">{authEmail}</span>
          <button
            type="button"
            onClick={signOut}
            className="text-sm underline hover:text-gray-700"
          >
            Sign out
          </button>
        </div>
      </div>

      <form onSubmit={save} className="space-y-5">
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
              className="mt-1 w-full border rounded-md p-2 bg-gray-50 text-gray-500 cursor-not-allowed"
              type="email"
              value={authEmail}
              readOnly
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
                  onChange={(e) => setSelectedRoleIds((prev) => toggle(prev, opt.id, e.target.checked))}
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
                  onChange={(e) => setSelectedSkillIds((prev) => toggle(prev, opt.id, e.target.checked))}
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
                  onChange={(e) => setSelectedLanguageIds((prev) => toggle(prev, opt.id, e.target.checked))}
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

        {/* Headshot */}
        <div className="border rounded-lg p-4">
          <div className="font-medium">Headshot Photo</div>
          {existingHeadshotUrl && !newHeadshotPreview && (
            <img
              src={existingHeadshotUrl}
              alt="Current headshot"
              className="mt-3 w-28 h-28 object-cover rounded-full border"
            />
          )}
          {newHeadshotPreview && (
            <img
              src={newHeadshotPreview}
              alt="New headshot preview"
              className="mt-3 w-28 h-28 object-cover rounded-full border"
            />
          )}
          <p className="text-sm text-gray-500 mt-2">
            Upload a new photo to replace your current one. JPEG, PNG, or WebP. Max {HEADSHOT_MAX_MB} MB.
          </p>
          <input
            ref={headshotRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleHeadshotChange}
            className="mt-2 block text-sm"
          />
        </div>

        {/* Video */}
        <div className="border rounded-lg p-4">
          <div className="font-medium">Intro Video</div>
          {existingVideoUrl && !newVideoPreview && (
            <video
              src={existingVideoUrl}
              controls
              className="mt-3 w-full max-w-sm rounded-lg border"
            />
          )}
          {newVideoPreview && (
            <video
              src={newVideoPreview}
              controls
              className="mt-3 w-full max-w-sm rounded-lg border"
            />
          )}
          <p className="text-sm text-gray-500 mt-2">
            Upload a new video to replace your current one. MP4, WebM, or MOV. Max {VIDEO_MAX_SECONDS} seconds, {VIDEO_MAX_MB} MB.
          </p>
          <input
            ref={videoRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={handleVideoChange}
            className="mt-2 block text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-black text-white rounded-md px-6 py-3 font-semibold disabled:opacity-60 hover:bg-gray-800 transition-colors"
        >
          {saving ? "Saving..." : "Update"}
        </button>

        {uploadStep && saving && (
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

        {status.type === "ok" && <div className="text-green-700 font-medium">{status.msg}</div>}
        {status.type === "error" && <div className="text-red-700">{status.msg}</div>}
      </form>

      <div className="mt-8 pt-6 border-t text-sm text-gray-500">
        <Link href="/" className="underline hover:text-gray-700">← Back to home</Link>
      </div>
    </main>
  )
}
