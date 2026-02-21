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

export default function SignupPage() {
  const [authUserId, setAuthUserId] = useState<string | null>(null)
  const [authEmail, setAuthEmail] = useState<string>("")

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        window.location.href = "/ba-register"
        return
      }
      const userId = data.session.user.id
      // If they already have a profile, send them to edit it instead
      const { data: existing } = await supabase
        .from("ambassadors")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle()
      if (existing) {
        window.location.href = "/my-profile"
        return
      }
      setAuthUserId(userId)
      setAuthEmail(data.session.user.email ?? "")
    }
    init()
  }, [])

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

  const update = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }))

  useEffect(() => {
    const load = async () => {
      const [{ data: r, error: er }, { data: s, error: es }] =
        await Promise.all([
          supabase.from("roles").select("id,name").order("name"),
          supabase.from("skills").select("id,name").order("name"),
        ])

      if (er || es) {
        setStatus({
          type: "error",
          msg: "Could not load roles/skills. Check Supabase RLS select policies on roles/skills.",
        })
        return
      }

      setRoles((r as Option[]) ?? [])
      setSkills((s as Option[]) ?? [])
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

    // Validate required fields
    if (!form.phone_number.trim()) {
      setStatus({ type: "error", msg: "Phone number is required." })
      setLoading(false)
      return
    }
    if (!form.city.trim()) {
      setStatus({ type: "error", msg: "City is required." })
      setLoading(false)
      return
    }
    if (!form.country) {
      setStatus({ type: "error", msg: "Country is required." })
      setLoading(false)
      return
    }
    if (!form.state_region.trim()) {
      setStatus({ type: "error", msg: "State / Province / Region is required." })
      setLoading(false)
      return
    }
    if (!form.bio.trim()) {
      setStatus({ type: "error", msg: "Bio is required." })
      setLoading(false)
      return
    }

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

      // 3. Insert ambassador row
      setUploadStep("Saving your profile...")
      setUploadProgress(90)

      const languageEntries = languagePairs
        .filter((p) => p.language)
        .map((p) => ({ language: p.language, ability: p.ability || "Beginner" }))

      const payload: Record<string, unknown> = {
        id: ambassadorId,
        user_id: authUserId,
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

    // Insert join tables (roles/skills)
    setUploadStep("Saving roles & skills...")
    setUploadProgress(95)

    const joins: Promise<unknown>[] = []

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

    const results = await Promise.all(joins)
    const joinError = (results as { error?: { message: string } }[]).find((r) => r?.error)?.error

    if (joinError) {
      setStatus({
        type: "error",
        msg:
          "Ambassador saved, but roles/skills failed to save: " +
          joinError.message +
          ". Check insert policies on join tables.",
      })
      setLoading(false)
      setUploadStep("")
      setUploadProgress(0)
      return
    }

    setUploadProgress(100)
    window.location.href = "/my-profile"
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
            <label className="block text-sm font-medium">Phone number <span className="text-red-500">*</span></label>
            <input
              className="mt-1 w-full border rounded-md p-2"
              value={form.phone_number}
              onChange={(e) => update("phone_number", e.target.value)}
              placeholder="+1 212 555 0123"
              required
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
            <label className="block text-sm font-medium">City <span className="text-red-500">*</span></label>
            <input
              className="mt-1 w-full border rounded-md p-2"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Country <span className="text-red-500">*</span></label>
            <select
              className="mt-1 w-full border rounded-md p-2"
              value={form.country}
              onChange={(e) => { update("country", e.target.value); update("state_region", "") }}
              required
            >
              <option value="">Select country…</option>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">State / Province / Region <span className="text-red-500">*</span></label>
            {form.country === "United States" ? (
              <select
                className="mt-1 w-full border rounded-md p-2"
                value={form.state_region}
                onChange={(e) => update("state_region", e.target.value)}
                required
              >
                <option value="">Select state…</option>
                {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : form.country === "Canada" ? (
              <select
                className="mt-1 w-full border rounded-md p-2"
                value={form.state_region}
                onChange={(e) => update("state_region", e.target.value)}
                required
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
                required
              />
            )}
          </div>
        </div>

        {/* Experience & Availability */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">Experience level <span className="text-red-500">*</span></label>
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
            <label className="block text-sm font-medium">Availability <span className="text-red-500">*</span></label>
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
                  onChange={(e) =>
                    setSelectedRoleIds((prev) => toggle(prev, opt.id, e.target.checked))
                  }
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
                  onChange={(e) =>
                    setSelectedSkillIds((prev) => toggle(prev, opt.id, e.target.checked))
                  }
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
                      updated[i] = { ...updated[i], language: e.target.value, ability: updated[i].ability }
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
          <label className="block text-sm font-medium">Bio <span className="text-red-500">*</span></label>
          <textarea
            className="mt-1 w-full border rounded-md p-2"
            rows={4}
            value={form.bio}
            onChange={(e) => update("bio", e.target.value)}
            required
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
