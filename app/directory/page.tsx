





import FiltersSidebar from "./FiltersSidebar"
import Link from "next/link"
import { getSupabase } from "@/lib/supabase"
import { getServerSupabase } from "@/lib/supabase-server"
import { syncSubscriptionFromCheckoutSession } from "@/lib/stripe-subscriptions"
import { getAllowedCountries } from "@/lib/region-countries"

type SearchParams = Record<string, string | string[] | undefined>

function toArray(v: string | string[] | undefined): string[] {
  if (!v) return []
  return Array.isArray(v) ? v : [v]
}

function toIntArray(v: string | string[] | undefined): number[] {
  return toArray(v)
    .flatMap((x) => x.split(",")) // supports skill=1,2 OR skill=1&skill=2
    .map((x) => parseInt(x.trim(), 10))
    .filter((n) => Number.isFinite(n))
}

function toBool(v: string | string[] | undefined): boolean {
  const s = (Array.isArray(v) ? v[0] : v) ?? ""
  return s === "1" || s === "true" || s === "on"
}

function toStr(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? ""
}

function buildHref(sp: SearchParams, patch: Record<string, string | null>) {
  const params = new URLSearchParams()

  // Preserve existing params
  for (const [k, v] of Object.entries(sp)) {
    if (v === undefined) continue
    if (Array.isArray(v)) v.forEach((vv) => params.append(k, vv))
    else params.append(k, v)
  }

  // Apply patch
  for (const [k, v] of Object.entries(patch)) {
    params.delete(k)
    if (v === null) continue
    params.set(k, v)
  }

  const qs = params.toString()
  return qs ? `/directory?${qs}` : `/directory`
}

async function getLatestSubscription(serverSupabase: Awaited<ReturnType<typeof getServerSupabase>>, userId: string) {
  const { data } = await serverSupabase
    .from("agency_subscriptions")
    .select("status, subscribed_continents")
    .eq("agency_user_id", userId)
    .in("status", ["active", "trialing"])
    .order("updated_at", { ascending: false })
    .limit(1)

  return data?.[0] ?? null
}

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = getSupabase()
  const sp = await searchParams

  // ----- Auth & subscription gate -----
  const serverSupabase = await getServerSupabase()
  const { data: { user } } = await serverSupabase.auth.getUser()

  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-3">Agency Access Required</h1>
          <p className="text-gray-600 mb-6">You must be logged in to view the directory.</p>
          <Link href="/login" className="bg-black text-white rounded-md px-6 py-3 font-semibold">
            Log In
          </Link>
        </div>
      </main>
    )
  }

  let subscription = await getLatestSubscription(serverSupabase, user.id)

  if (!subscription) {
    const isCheckoutSuccess = toStr(sp.success) === "true"
    const sessionId = toStr(sp.session_id).trim()

    // Fallback for delayed/missed webhooks: sync directly from successful checkout session.
    if (isCheckoutSuccess && sessionId) {
      try {
        await syncSubscriptionFromCheckoutSession(sessionId, user.id)
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error"
        console.error("Stripe post-checkout sync failed:", message)
      }

      subscription = await getLatestSubscription(serverSupabase, user.id)
    }
  }

  if (!subscription) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <h1 className="text-2xl font-bold mb-3">Subscription Required</h1>
          <p className="text-gray-600 mb-6">
            Subscribe to access the brand ambassador directory. Plans start at $500/month per region.
          </p>
          <Link href="/subscribe" className="bg-black text-white rounded-md px-6 py-3 font-semibold">
            View Plans
          </Link>
        </div>
      </main>
    )
  }

  // ----- Subscription region filtering -----
  const subscribedRegions: string[] = subscription.subscribed_continents ?? []
  const allowedCountries = getAllowedCountries(subscribedRegions)

  // ----- Core filters -----
  const q = toStr(sp.q).trim()
  const experience = toStr(sp.experience).trim()
  const availability = toStr(sp.availability).trim()

  const roleIds = toIntArray(sp.role)
  const skillIds = toIntArray(sp.skill)
  const langIds = toIntArray(sp.lang)

  const hasVehicle = toBool(sp.vehicle)
  const travel = toBool(sp.travel)

  // ----- Location dropdown filters -----
  const country = toStr(sp.country).trim()
  const state = toStr(sp.state).trim()

  // ----- Match mode: ANY vs ALL -----
  // any = overlaps (has at least one selected)
  // all = contains (has every selected)
  const matchMode = (toStr(sp.match) || "any").trim() as "any" | "all"
  const isAll = matchMode === "all"

  // ----- Pagination -----
  const page = Math.max(parseInt(toStr(sp.page) || "1", 10) || 1, 1)
  const per = Math.min(Math.max(parseInt(toStr(sp.per) || "25", 10) || 25, 10), 50) // 10..50
  const from = (page - 1) * per
  const to = from + per - 1

  // Sidebar option lists (roles/skills/languages)
  const [{ data: roles }, { data: skills }, { data: languages }] = await Promise.all([
    supabase.from("roles").select("id,name").order("name"),
    supabase.from("skills").select("id,name").order("name"),
    supabase.from("languages").select("id,name").order("name"),
  ])

  // Build country/state dropdown options from existing ambassadors (MVP approach)
  // (For 100k+ we’ll replace this with a materialized view / distinct RPC)
  const { data: locRows } = await supabase
    .from("ambassadors")
    .select("country,state_region")
    .limit(5000)

  const countrySet = new Set<string>()
  const statesByCountry = new Map<string, Set<string>>()

  const allowedSet = new Set(allowedCountries)

  ;(locRows ?? []).forEach((r: any) => {
    const c = (r.country ?? "").trim()
    const s = (r.state_region ?? "").trim()
    if (!c) return
    if (allowedSet.size > 0 && !allowedSet.has(c)) return
    countrySet.add(c)
    if (!statesByCountry.has(c)) statesByCountry.set(c, new Set())
    if (s) statesByCountry.get(c)!.add(s)
  })

  const countryOptions = Array.from(countrySet).sort((a, b) => a.localeCompare(b))
  const stateOptions =
    country && statesByCountry.has(country)
      ? Array.from(statesByCountry.get(country)!).sort((a, b) => a.localeCompare(b))
      : []

  // ----- Directory query via VIEW -----
  let query = supabase
    .from("ambassadors_directory")
    .select("*")
    .order("created_at", { ascending: false })
    .range(from, to)

  // Filter by subscribed regions
  if (allowedCountries.length > 0) {
    query = query.in("country", allowedCountries)
  }

  if (experience) query = query.eq("experience_level", experience)
  if (availability) query = query.eq("availability_status", availability)
  if (hasVehicle) query = query.eq("has_vehicle", true)
  if (travel) query = query.eq("willing_to_travel", true)

  if (country) query = query.eq("country", country)
  if (state) query = query.eq("state_region", state)

  // Match ANY vs ALL
  if (roleIds.length) query = isAll ? query.contains("role_ids", roleIds) : query.overlaps("role_ids", roleIds)
  if (skillIds.length) query = isAll ? query.contains("skill_ids", skillIds) : query.overlaps("skill_ids", skillIds)
  if (langIds.length) query = isAll ? query.contains("language_ids", langIds) : query.overlaps("language_ids", langIds)

  if (q) {
    query = query.or(
      [
        `full_name.ilike.%${q}%`,
        `city.ilike.%${q}%`,
        `state_region.ilike.%${q}%`,
        `country.ilike.%${q}%`,
        `instagram_handle.ilike.%${q}%`,
        `bio.ilike.%${q}%`,
      ].join(",")
    )
  }

  const { data: ambassadors, error } = await query
  const countOnPage = (ambassadors ?? []).length

  // Pagination links (we don’t know total count yet; we’ll add exact counts next)
  const prevHref = page > 1 ? buildHref(sp, { page: String(page - 1) }) : null
  const nextHref = countOnPage === per ? buildHref(sp, { page: String(page + 1) }) : null

  const anyResults = countOnPage > 0

  return (
    <main className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Directory</h1>
        <div className="flex gap-3">
          <Link className="underline" href="/">Home</Link>
          <Link className="underline" href="/signup">Signup</Link>
        </div>
      </div>

      {error && (
        <div className="mt-6 border border-red-300 bg-red-50 p-4 rounded-md">
          <div className="font-semibold text-lg text-red-700">Error loading ambassadors</div>
          <div className="text-sm text-red-700 mt-2">
            If this says <span className="font-mono">relation "ambassadors_directory" does not exist</span>, you need to create the view.
          </div>
          <pre className="text-sm mt-3">{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        {/* SIDEBAR */}
        <FiltersSidebar
  roles={(roles as any) ?? []}
  skills={(skills as any) ?? []}
  languages={(languages as any) ?? []}
  countryOptions={countryOptions}
  statesByCountry={Object.fromEntries(
    Array.from(statesByCountry.entries()).map(([c, set]) => [c, Array.from(set).sort((a, b) => a.localeCompare(b))])
  )}
  defaultQ={q}
  defaultMatch={matchMode as any}
  defaultCountry={country}
  defaultState={state}
  defaultExperience={experience}
  defaultAvailability={availability}
  defaultVehicle={hasVehicle}
  defaultTravel={travel}
  defaultRoleIds={roleIds}
  defaultSkillIds={skillIds}
  defaultLangIds={langIds}
  defaultPer={per}
/>

        {/* RESULTS */}
        <section>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {countOnPage} result(s) • Page {page}
            </div>

            <div className="flex gap-3">
              {prevHref ? (
                <Link className="underline text-sm" href={prevHref}>
                  ← Prev
                </Link>
              ) : (
                <span className="text-sm text-gray-400">← Prev</span>
              )}

              {nextHref ? (
                <Link className="underline text-sm" href={nextHref}>
                  Next →
                </Link>
              ) : (
                <span className="text-sm text-gray-400">Next →</span>
              )}
            </div>
          </div>

          {!error && !anyResults && (
            <div className="mt-6 text-gray-600">
              No matches. Try clearing filters or using broader criteria.
            </div>
          )}

          <div className="mt-4 grid gap-4">
            {(ambassadors ?? []).map((a: any) => (
              <Link
                key={a.id}
                href={`/directory/${a.id}`}
                className="block border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold text-lg">{a.full_name}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {(a.city ? `${a.city}, ` : "") +
                        (a.state_region ? `${a.state_region}, ` : "") +
                        (a.country ?? "")}
                    </div>
                  </div>

                  <div className="text-right text-sm text-gray-600">
                    <div>{a.experience_level ?? ""}</div>
                    <div className="mt-1">{a.availability_status ?? ""}</div>
                  </div>
                </div>

                <div className="text-sm mt-3">
                  IG: {a.instagram_handle ? `@${a.instagram_handle}` : "—"} • Phone:{" "}
                  {a.phone_number ?? "—"}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {(a.role_names ?? []).slice(0, 6).map((name: string) => (
                    <span key={`r-${name}`} className="text-xs border rounded-full px-2 py-1">
                      {name}
                    </span>
                  ))}
                  {(a.skill_names ?? []).slice(0, 6).map((name: string) => (
                    <span key={`s-${name}`} className="text-xs border rounded-full px-2 py-1">
                      {name}
                    </span>
                  ))}
                  {(a.language_names ?? []).slice(0, 6).map((name: string) => (
                    <span key={`l-${name}`} className="text-xs border rounded-full px-2 py-1">
                      {name}
                    </span>
                  ))}
                </div>

                {a.bio && <div className="text-sm text-gray-700 mt-3">{a.bio}</div>}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
