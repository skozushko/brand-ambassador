"use client"

import { useEffect, useState } from "react"
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps"

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

// ISO 3166-1 numeric → region name
// US, Canada, Mexico are their own subscription regions; everything else maps to a continent.
const ISO_TO_REGION: Record<string, string> = {
  // ── United States ────────────────────────────────────────────────
  "840": "United States",

  // ── Canada ───────────────────────────────────────────────────────
  "124": "Canada",

  // ── Mexico ───────────────────────────────────────────────────────
  "484": "Mexico",

  // ── North America (Central America + Caribbean) ──────────────────
  "028": "North America", // Antigua and Barbuda
  "044": "North America", // Bahamas
  "052": "North America", // Barbados
  "084": "North America", // Belize
  "188": "North America", // Costa Rica
  "192": "North America", // Cuba
  "214": "North America", // Dominican Republic
  "222": "North America", // El Salvador
  "308": "North America", // Grenada
  "320": "North America", // Guatemala
  "332": "North America", // Haiti
  "340": "North America", // Honduras
  "388": "North America", // Jamaica
  "558": "North America", // Nicaragua
  "591": "North America", // Panama
  "659": "North America", // Saint Kitts and Nevis
  "662": "North America", // Saint Lucia
  "670": "North America", // Saint Vincent
  "780": "North America", // Trinidad and Tobago
  "312": "North America", // Guadeloupe
  "474": "North America", // Martinique
  "630": "North America", // Puerto Rico
  "850": "North America", // US Virgin Islands

  // ── South America ────────────────────────────────────────────────
  "032": "South America", // Argentina
  "068": "South America", // Bolivia
  "076": "South America", // Brazil
  "152": "South America", // Chile
  "170": "South America", // Colombia
  "218": "South America", // Ecuador
  "238": "South America", // Falkland Islands
  "254": "South America", // French Guiana
  "328": "South America", // Guyana
  "600": "South America", // Paraguay
  "604": "South America", // Peru
  "740": "South America", // Suriname
  "858": "South America", // Uruguay
  "862": "South America", // Venezuela

  // ── Europe ───────────────────────────────────────────────────────
  "008": "Europe", // Albania
  "020": "Europe", // Andorra
  "040": "Europe", // Austria
  "112": "Europe", // Belarus
  "056": "Europe", // Belgium
  "070": "Europe", // Bosnia and Herzegovina
  "100": "Europe", // Bulgaria
  "191": "Europe", // Croatia
  "203": "Europe", // Czech Republic
  "208": "Europe", // Denmark
  "233": "Europe", // Estonia
  "246": "Europe", // Finland
  "250": "Europe", // France
  "276": "Europe", // Germany
  "300": "Europe", // Greece
  "348": "Europe", // Hungary
  "352": "Europe", // Iceland
  "372": "Europe", // Ireland
  "380": "Europe", // Italy
  "383": "Europe", // Kosovo
  "428": "Europe", // Latvia
  "440": "Europe", // Lithuania
  "442": "Europe", // Luxembourg
  "470": "Europe", // Malta
  "492": "Europe", // Monaco
  "498": "Europe", // Moldova
  "499": "Europe", // Montenegro
  "528": "Europe", // Netherlands
  "807": "Europe", // North Macedonia
  "578": "Europe", // Norway
  "616": "Europe", // Poland
  "620": "Europe", // Portugal
  "642": "Europe", // Romania
  "674": "Europe", // San Marino
  "688": "Europe", // Serbia
  "703": "Europe", // Slovakia
  "705": "Europe", // Slovenia
  "724": "Europe", // Spain
  "752": "Europe", // Sweden
  "756": "Europe", // Switzerland
  "804": "Europe", // Ukraine
  "826": "Europe", // United Kingdom
  "336": "Europe", // Vatican City

  // ── Africa ───────────────────────────────────────────────────────
  "012": "Africa", // Algeria
  "024": "Africa", // Angola
  "204": "Africa", // Benin
  "072": "Africa", // Botswana
  "854": "Africa", // Burkina Faso
  "108": "Africa", // Burundi
  "120": "Africa", // Cameroon
  "140": "Africa", // Central African Republic
  "148": "Africa", // Chad
  "174": "Africa", // Comoros
  "178": "Africa", // Congo
  "180": "Africa", // DR Congo
  "262": "Africa", // Djibouti
  "818": "Africa", // Egypt
  "232": "Africa", // Eritrea
  "231": "Africa", // Ethiopia
  "266": "Africa", // Gabon
  "270": "Africa", // Gambia
  "288": "Africa", // Ghana
  "324": "Africa", // Guinea
  "624": "Africa", // Guinea-Bissau
  "384": "Africa", // Ivory Coast
  "404": "Africa", // Kenya
  "426": "Africa", // Lesotho
  "430": "Africa", // Liberia
  "434": "Africa", // Libya
  "450": "Africa", // Madagascar
  "454": "Africa", // Malawi
  "466": "Africa", // Mali
  "478": "Africa", // Mauritania
  "480": "Africa", // Mauritius
  "504": "Africa", // Morocco
  "508": "Africa", // Mozambique
  "516": "Africa", // Namibia
  "562": "Africa", // Niger
  "566": "Africa", // Nigeria
  "646": "Africa", // Rwanda
  "678": "Africa", // São Tomé and Príncipe
  "686": "Africa", // Senegal
  "694": "Africa", // Sierra Leone
  "706": "Africa", // Somalia
  "710": "Africa", // South Africa
  "728": "Africa", // South Sudan
  "729": "Africa", // Sudan
  "748": "Africa", // Eswatini
  "834": "Africa", // Tanzania
  "768": "Africa", // Togo
  "788": "Africa", // Tunisia
  "800": "Africa", // Uganda
  "732": "Africa", // Western Sahara
  "894": "Africa", // Zambia
  "716": "Africa", // Zimbabwe

  // ── Asia ─────────────────────────────────────────────────────────
  "004": "Asia", // Afghanistan
  "051": "Asia", // Armenia
  "031": "Asia", // Azerbaijan
  "048": "Asia", // Bahrain
  "050": "Asia", // Bangladesh
  "064": "Asia", // Bhutan
  "096": "Asia", // Brunei
  "116": "Asia", // Cambodia
  "156": "Asia", // China
  "196": "Asia", // Cyprus
  "268": "Asia", // Georgia
  "356": "Asia", // India
  "360": "Asia", // Indonesia
  "364": "Asia", // Iran
  "368": "Asia", // Iraq
  "376": "Asia", // Israel
  "392": "Asia", // Japan
  "400": "Asia", // Jordan
  "398": "Asia", // Kazakhstan
  "414": "Asia", // Kuwait
  "417": "Asia", // Kyrgyzstan
  "418": "Asia", // Laos
  "422": "Asia", // Lebanon
  "458": "Asia", // Malaysia
  "462": "Asia", // Maldives
  "496": "Asia", // Mongolia
  "104": "Asia", // Myanmar
  "524": "Asia", // Nepal
  "408": "Asia", // North Korea
  "512": "Asia", // Oman
  "586": "Asia", // Pakistan
  "275": "Asia", // Palestine
  "608": "Asia", // Philippines
  "634": "Asia", // Qatar
  "643": "Asia", // Russia
  "682": "Asia", // Saudi Arabia
  "702": "Asia", // Singapore
  "410": "Asia", // South Korea
  "144": "Asia", // Sri Lanka
  "760": "Asia", // Syria
  "158": "Asia", // Taiwan
  "762": "Asia", // Tajikistan
  "764": "Asia", // Thailand
  "626": "Asia", // Timor-Leste
  "792": "Asia", // Turkey
  "795": "Asia", // Turkmenistan
  "784": "Asia", // United Arab Emirates
  "860": "Asia", // Uzbekistan
  "704": "Asia", // Vietnam
  "887": "Asia", // Yemen

  // ── Oceania ──────────────────────────────────────────────────────
  "036": "Oceania", // Australia
  "242": "Oceania", // Fiji
  "296": "Oceania", // Kiribati
  "584": "Oceania", // Marshall Islands
  "583": "Oceania", // Micronesia
  "520": "Oceania", // Nauru
  "554": "Oceania", // New Zealand
  "585": "Oceania", // Palau
  "598": "Oceania", // Papua New Guinea
  "090": "Oceania", // Solomon Islands
  "776": "Oceania", // Tonga
  "798": "Oceania", // Tuvalu
  "548": "Oceania", // Vanuatu
  "882": "Oceania", // Samoa
}

const REGION_CONFIG: Record<string, {
  color: string
  hover: string
  centroid: [number, number]
}> = {
  "United States": { color: "#F97316", hover: "#EA580C", centroid: [-98, 38] },
  "Canada":        { color: "#14B8A6", hover: "#0D9488", centroid: [-96, 60] },
  "Mexico":        { color: "#EC4899", hover: "#DB2777", centroid: [-102, 23] },
  "North America": { color: "#3B82F6", hover: "#2563EB", centroid: [-73, 16] },
  "South America": { color: "#10B981", hover: "#059669", centroid: [-58, -15] },
  "Europe":        { color: "#8B5CF6", hover: "#7C3AED", centroid: [15, 52] },
  "Africa":        { color: "#F59E0B", hover: "#D97706", centroid: [22, 5] },
  "Asia":          { color: "#EF4444", hover: "#DC2626", centroid: [90, 47] },
  "Oceania":       { color: "#06B6D4", hover: "#0891B2", centroid: [133, -25] },
}

const REGIONS = [
  "United States", "Canada", "Mexico",
  "North America", "South America",
  "Europe", "Africa", "Asia", "Oceania",
]

const UNMAPPED_COLOR = "#D1D5DB"

type Stats = { total: number; byContinent: Record<string, number> }

export default function WorldMapDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/ambassador-stats")
      if (!res.ok) return
      const data: Stats = await res.json()
      setStats(data)
      setLastUpdated(new Date())
    } catch {
      // silently ignore — stale data is fine
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30_000)
    return () => clearInterval(interval)
  }, [])

  const sortedRegions = REGIONS
    .map((name) => ({ name, count: stats?.byContinent[name] ?? 0 }))
    .sort((a, b) => b.count - a.count)

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-gray-800">
            {stats ? (
              <>
                <span className="text-2xl font-bold text-gray-900">{stats.total.toLocaleString()}</span>
                {" "}Brand Ambassadors Worldwide
              </>
            ) : (
              <span className="text-gray-400">Loading…</span>
            )}
          </h2>
          {stats && (
            <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              LIVE
            </span>
          )}
        </div>
        {lastUpdated && (
          <span className="text-xs text-gray-400">
            Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      {/* Map + Sidebar */}
      <div className="flex">

        {/* World Map */}
        <div className="flex-1 min-w-0">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ scale: 118, center: [0, 20] }}
            style={{ width: "100%", height: "auto" }}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const isoKey = String(geo.id).padStart(3, "0")
                  const region = ISO_TO_REGION[isoKey]
                  const cfg = region ? REGION_CONFIG[region] : undefined
                  const fill = cfg?.color ?? UNMAPPED_COLOR
                  const hoverFill = cfg?.hover ?? "#9CA3AF"
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fill}
                      stroke="#FFFFFF"
                      strokeWidth={0.4}
                      style={{
                        default: { fill, outline: "none" },
                        hover:   { fill: hoverFill, outline: "none" },
                        pressed: { fill: hoverFill, outline: "none" },
                      }}
                    />
                  )
                })
              }
            </Geographies>

            {/* Count badges at region centroids */}
            {stats && REGIONS.map((name) => {
              const count = stats.byContinent[name] ?? 0
              const cfg = REGION_CONFIG[name]
              return (
                <Marker key={name} coordinates={cfg.centroid}>
                  <circle r={13} fill="white" fillOpacity={0.92} stroke={cfg.color} strokeWidth={1.5} />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    style={{
                      fontSize: 8,
                      fontWeight: 700,
                      fill: count > 0 ? cfg.color : "#9CA3AF",
                      fontFamily: "system-ui, sans-serif",
                    }}
                  >
                    {count}
                  </text>
                </Marker>
              )
            })}
          </ComposableMap>
        </div>

        {/* Legend sidebar */}
        <div className="w-52 flex-shrink-0 border-l border-gray-100 p-5">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">By Region</div>
          <div className="space-y-2">
            {sortedRegions.map(({ name, count }) => {
              const cfg = REGION_CONFIG[name]
              const active = count > 0
              return (
                <div key={name} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3 h-3 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: active ? cfg.color : UNMAPPED_COLOR }}
                    />
                    <span className={`text-sm truncate ${active ? "text-gray-700" : "text-gray-400"}`}>
                      {name}
                    </span>
                  </div>
                  <span className={`text-sm font-semibold flex-shrink-0 tabular-nums ${active ? "text-gray-900" : "text-gray-400"}`}>
                    {count}
                  </span>
                </div>
              )
            })}
          </div>

          {(stats?.byContinent["Other"] ?? 0) > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: UNMAPPED_COLOR }} />
                <span className="text-sm text-gray-400">Other</span>
              </div>
              <span className="text-sm font-semibold text-gray-400 tabular-nums">
                {stats!.byContinent["Other"]}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
