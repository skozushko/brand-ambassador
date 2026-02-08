"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

type Option = { id: number; name: string }

export default function FiltersSidebar(props: {
  // options
  roles: Option[]
  skills: Option[]
  languages: Option[]
  countryOptions: string[]
  statesByCountry: Record<string, string[]>

  // defaults (from URL)
  defaultQ: string
  defaultMatch: "any" | "all"
  defaultCountry: string
  defaultState: string
  defaultExperience: string
  defaultAvailability: string
  defaultVehicle: boolean
  defaultTravel: boolean
  defaultRoleIds: number[]
  defaultSkillIds: number[]
  defaultLangIds: number[]
  defaultPer: number
}) {
  const [country, setCountry] = useState(props.defaultCountry)

  const stateOptions = useMemo(() => {
    if (!country) return []
    return props.statesByCountry[country] ?? []
  }, [country, props.statesByCountry])

  return (
    <aside className="border rounded-lg p-4 h-fit">
      <form method="get" className="space-y-5">
        <div>
          <label className="block text-sm font-medium">Search</label>
          <input
            name="q"
            defaultValue={props.defaultQ}
            className="mt-1 w-full border rounded-md p-2"
            placeholder="Name, city, IG, bio…"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Match mode</label>
          <select name="match" defaultValue={props.defaultMatch} className="mt-1 w-full border rounded-md p-2">
            <option value="any">ANY selected</option>
            <option value="all">ALL selected</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-sm font-medium">Country</label>
            <select
              name="country"
              value={country}
              onChange={(e) => {
                setCountry(e.target.value)
              }}
              className="mt-1 w-full border rounded-md p-2"
            >
              <option value="">All</option>
              {props.countryOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">State / Region</label>
            <select
              name="state"
              defaultValue={props.defaultState}
              className="mt-1 w-full border rounded-md p-2"
              disabled={!country}
            >
              <option value="">All</option>
              {stateOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <div className="text-xs text-gray-600 mt-1">
              {country ? "Now choose a region." : "Pick a country first."}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Experience</label>
          <select name="experience" defaultValue={props.defaultExperience} className="mt-1 w-full border rounded-md p-2">
            <option value="">All</option>
            <option value="new">New</option>
            <option value="experienced">Experienced</option>
            <option value="elite">Elite</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Availability</label>
          <select name="availability" defaultValue={props.defaultAvailability} className="mt-1 w-full border rounded-md p-2">
            <option value="">All</option>
            <option value="available">Available</option>
            <option value="limited">Limited</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="vehicle" defaultChecked={props.defaultVehicle} />
            Has vehicle
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="travel" defaultChecked={props.defaultTravel} />
            Willing to travel
          </label>
        </div>

        <div className="border-t pt-4">
          <div className="font-medium">Roles</div>
          <div className="mt-2 space-y-2 max-h-48 overflow-auto pr-2">
            {props.roles.map((r) => (
              <label key={r.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="role" value={String(r.id)} defaultChecked={props.defaultRoleIds.includes(r.id)} />
                {r.name}
              </label>
            ))}
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="font-medium">Skills</div>
          <div className="mt-2 space-y-2 max-h-48 overflow-auto pr-2">
            {props.skills.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="skill" value={String(s.id)} defaultChecked={props.defaultSkillIds.includes(s.id)} />
                {s.name}
              </label>
            ))}
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="font-medium">Languages</div>
          <div className="mt-2 space-y-2 max-h-48 overflow-auto pr-2">
            {props.languages.map((l) => (
              <label key={l.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="lang" value={String(l.id)} defaultChecked={props.defaultLangIds.includes(l.id)} />
                {l.name}
              </label>
            ))}
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="font-medium">Results per page</div>
          <select name="per" defaultValue={String(props.defaultPer)} className="mt-2 w-full border rounded-md p-2">
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
          <input type="hidden" name="page" value="1" />
        </div>

        <div className="flex gap-3 pt-2">
          <button className="bg-black text-white rounded-md px-4 py-2" type="submit">
            Apply
          </button>
          <Link className="underline text-sm self-center" href="/directory">
            Clear
          </Link>
        </div>
      </form>
    </aside>
  )
}