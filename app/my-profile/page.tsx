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

const MAJOR_LANGUAGES = [
  "Afrikaans", "Albanian", "Amharic", "Arabic", "Armenian", "Azerbaijani",
  "Basque", "Belarusian", "Bengali", "Bosnian", "Bulgarian", "Burmese",
  "Cantonese (Chinese)", "Catalan", "Croatian", "Czech",
  "Danish", "Dutch",
  "English", "Estonian",
  "Farsi/Persian", "Filipino/Tagalog", "Finnish", "French",
  "Galician", "Georgian", "German", "Greek", "Gujarati",
  "Hausa", "Hebrew", "Hindi", "Hungarian",
  "Icelandic", "Indonesian", "Italian",
  "Japanese", "Javanese",
  "Kannada", "Kazakh", "Khmer", "Korean",
  "Lao", "Latvian", "Lithuanian",
  "Macedonian", "Malay", "Malayalam", "Maltese", "Mandarin Chinese", "Marathi", "Mongolian",
  "Nepali", "Norwegian",
  "Pashto", "Polish", "Portuguese", "Punjabi",
  "Romanian", "Russian",
  "Serbian", "Sinhalese", "Slovak", "Slovenian", "Somali", "Spanish", "Swahili", "Swedish",
  "Tamil", "Telugu", "Thai", "Turkish",
  "Ukrainian", "Urdu", "Uzbek",
  "Vietnamese",
  "Welsh",
  "Yoruba",
  "Zulu",
]

const ABILITY_LEVELS = ["Beginner", "Intermediate", "Fluent"]

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
    first_name: "",
    last_name: "",
    phone_number: "",
    instagram_handle: "",
    city: "",
    state_region: "",
    country: "",
    experience_level: "brand_new",
    bio: "",
    willing_to_travel: false,
    has_vehicle: false,
    availability_status: "open",
    can_work_weekends: true,
    can_work_nights: true,
    custom_skills: "",
  })

  const [roles, setRoles] = useState<Option[]>([])
  const [skills, setSkills] = useState<Option[]>([])
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([])
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([])

  const [languagePairs, setLanguagePairs] = useState([
    { language: "", ability: "" },
    { language: "", ability: "" },
    { language: "", ability: "" },
  ])

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
      ] = await Promise.all([
        supabase.from("ambassadors").select("*").eq("user_id", userId).single(),
        supabase.from("roles").select("id,name").order("name"),
        supabase.from("skills").select("id,name").order("name"),
      ])

      if (ambErr || !ambassador) {
        window.location.href = "/signup"
        return
      }

      setAmbassadorId(ambassador.id)
      setExistingHeadshotUrl(ambassador.headshot_url ?? null)
      setExistingVideoUrl(ambassador.video_url ?? null)
      setForm({
        first_name: ambassador.first_name ?? "",
        last_name: ambassador.last_name ?? "",
        phone_number: ambassador.phone_number ?? "",
        instagram_handle: ambassador.instagram_handle ?? "",
        city: ambassador.city ?? "",
        state_region: ambassador.state_region ?? "",
        country: ambassador.country ?? "",
        experience_level: ambassador.experience_level ?? "brand_new",
        bio: ambassador.bio ?? "",
        willing_to_travel: ambassador.willing_to_travel ?? false,
        has_vehicle: ambassador.has_vehicle ?? false,
        availability_status: ambassador.availability_status ?? "open",
        can_work_weekends: ambassador.can_work_weekends ?? true,
        can_work_nights: ambassador.can_work_nights ?? true,
        custom_skills: ambassador.custom_skills ?? "",
      })

      // Load saved language entries (up to 3)
      const entries: { language: string; ability: string }[] = ambassador.language_entries ?? []
      setLanguagePairs([
        entries[0] ?? { language: "", ability: "" },
        entries[1] ?? { language: "", ability: "" },
        entries[2] ?? { language: "", ability: "" },
      ])

      setRoles((r as Option[]) ?? [])
      setSkills((s as Option[]) ?? [])

      // Load existing join selections
      const [{ data: ar }, { data: as_ }] = await Promise.all([
        supabase.from("ambassador_roles").select("role_id").eq("ambassador_id", ambassador.id),
        supabase.from("ambassador_skills").select("skill_id").eq("ambassador_id", ambassador.id),
      ])

      setSelectedRoleIds((ar ?? []).map((x: { role_id: number }) => x.role_id))
      setSelectedSkillIds((as_ ?? []).map((x: { skill_id: number }) => x.skill_id))

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

      const languageEntries = languagePairs
        .filter((p) => p.language)
        .map((p) => ({ language: p.language, ability: p.ability || "Beginner" }))

      const updatePayload: Record<string, unknown> = {
        ...form,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: authEmail.trim().toLowerCase(),
        instagram_handle: form.instagram_handle.replace(/^@/, "").trim() || null,
        phone_number: form.phone_number.trim() || null,
        city: form.city.trim() || null,
        state_region: form.state_region.trim() || null,
        country: form.country.trim() || null,
        bio: form.bio.trim() || null,
        custom_skills: form.custom_skills.trim() || null,
        language_entries: languageEntries,
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
      ])

      const joins: Promise<unknown>[] = []
      if (selectedRoleIds.length)
        joins.push(Promise.resolve(supabase.from("ambassador_roles").insert(selectedRoleIds.map((role_id) => ({ ambassador_id: ambassadorId, role_id })))))
      if (selectedSkillIds.length)
        joins.push(Promise.resolve(supabase.from("ambassador_skills").insert(selectedSkillIds.map((skill_id) => ({ ambassador_id: ambassadorId, skill_id })))))

      await Promise.all(joins)

      setUploadProgress(100)

      // Update local state if new files were uploaded
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
        {/* Name & Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">First name <span className="text-red-500">*</span></label>
            <input
              className="mt-1 w-full border rounded-md p-2"
              value={form.first_name}
              onChange={(e) => update("first_name", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Last name <span className="text-red-500">*</span></label>
            <input
              className="mt-1 w-full border rounded-md p-2"
              value={form.last_name}
              onChange={(e) => update("last_name", e.target.value)}
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

        {/* Location */}
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
        </div>

        {/* Experience & Availability */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">Experience level</label>
            <select
              className="mt-1 w-full border rounded-md p-2"
              value={form.experience_level}
              onChange={(e) => update("experience_level", e.target.value)}
            >
              <option value="brand_new">Brand New</option>
              <option value="little_experience">A Little Experience</option>
              <option value="more_than_a_year">More Than A Year</option>
              <option value="industry_vet">Industry Vet</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Availability</label>
            <select
              className="mt-1 w-full border rounded-md p-2"
              value={form.availability_status}
              onChange={(e) => update("availability_status", e.target.value)}
            >
              <option value="open">Open</option>
              <option value="limited">Limited</option>
            </select>
          </div>
        </div>

        {/* Checkboxes */}
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

        {/* Roles */}
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

        {/* Skills */}
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
          <div className="mt-3 pt-3 border-t">
            <label className="block text-sm font-medium text-gray-700">Other (add your own)</label>
            <input
              className="mt-1 w-full border rounded-md p-2 text-sm"
              value={form.custom_skills}
              onChange={(e) => update("custom_skills", e.target.value)}
              placeholder="e.g. Stilt walking, Balloon art"
            />
          </div>
        </div>

        {/* Languages */}
        <div className="border rounded-lg p-4">
          <div className="font-medium mb-3">Languages</div>
          <div className="space-y-3">
            {languagePairs.map((pair, i) => (
              <div key={i} className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Language {i + 1}</label>
                  <select
                    className="w-full border rounded-md p-2 text-sm"
                    value={pair.language}
                    onChange={(e) => {
                      const updated = [...languagePairs]
                      updated[i] = { ...updated[i], language: e.target.value }
                      setLanguagePairs(updated)
                    }}
                  >
                    <option value="">Select language…</option>
                    {MAJOR_LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Ability</label>
                  <select
                    className="w-full border rounded-md p-2 text-sm"
                    value={pair.ability}
                    onChange={(e) => {
                      const updated = [...languagePairs]
                      updated[i] = { ...updated[i], ability: e.target.value }
                      setLanguagePairs(updated)
                    }}
                    disabled={!pair.language}
                  >
                    <option value="">Select level…</option>
                    {ABILITY_LEVELS.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bio */}
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
