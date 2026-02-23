import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

// Service role client — bypasses RLS so the public home page can read aggregate counts
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const COUNTRY_TO_CONTINENT: Record<string, string> = {
  // Africa
  Algeria: "Africa", Angola: "Africa", Benin: "Africa", Botswana: "Africa",
  "Burkina Faso": "Africa", Burundi: "Africa", Cameroon: "Africa",
  "Central African Republic": "Africa", Chad: "Africa",
  Comoros: "Africa", Congo: "Africa", "DR Congo": "Africa", "Democratic Republic of the Congo": "Africa",
  Djibouti: "Africa", Egypt: "Africa", Eritrea: "Africa", Eswatini: "Africa",
  Ethiopia: "Africa", Gabon: "Africa", Gambia: "Africa", Ghana: "Africa",
  Guinea: "Africa", "Guinea-Bissau": "Africa", "Ivory Coast": "Africa", "Côte d'Ivoire": "Africa",
  Kenya: "Africa", Lesotho: "Africa", Liberia: "Africa", Libya: "Africa",
  Madagascar: "Africa", Malawi: "Africa", Mali: "Africa", Mauritania: "Africa",
  Mauritius: "Africa", Morocco: "Africa", Mozambique: "Africa",
  Namibia: "Africa", Niger: "Africa", Nigeria: "Africa", Rwanda: "Africa",
  "São Tomé and Príncipe": "Africa", Senegal: "Africa", "Sierra Leone": "Africa",
  Somalia: "Africa", "South Africa": "Africa", "South Sudan": "Africa",
  Sudan: "Africa", Tanzania: "Africa", Togo: "Africa",
  Tunisia: "Africa", Uganda: "Africa", "Western Sahara": "Africa",
  Zambia: "Africa", Zimbabwe: "Africa",

  // Asia
  Afghanistan: "Asia", Armenia: "Asia", Azerbaijan: "Asia", Bahrain: "Asia",
  Bangladesh: "Asia", Brunei: "Asia", Cambodia: "Asia", China: "Asia",
  Cyprus: "Asia", Georgia: "Asia", India: "Asia", Indonesia: "Asia",
  Iran: "Asia", Iraq: "Asia", Israel: "Asia", Japan: "Asia",
  Jordan: "Asia", Kazakhstan: "Asia", Kuwait: "Asia", Kyrgyzstan: "Asia",
  Laos: "Asia", Lebanon: "Asia", Malaysia: "Asia", Mongolia: "Asia",
  Myanmar: "Asia", Nepal: "Asia", "North Korea": "Asia", Oman: "Asia",
  Pakistan: "Asia", Philippines: "Asia", Qatar: "Asia",
  "Saudi Arabia": "Asia", Singapore: "Asia", "South Korea": "Asia",
  "Sri Lanka": "Asia", Syria: "Asia", Taiwan: "Asia", Tajikistan: "Asia",
  Thailand: "Asia", Turkey: "Asia", Turkmenistan: "Asia",
  "United Arab Emirates": "Asia", Uzbekistan: "Asia", Vietnam: "Asia",
  Yemen: "Asia", Russia: "Asia",

  // Europe
  Albania: "Europe", Andorra: "Europe", Austria: "Europe", Belarus: "Europe",
  Belgium: "Europe", "Bosnia and Herzegovina": "Europe", Bulgaria: "Europe",
  Croatia: "Europe", "Czech Republic": "Europe", Denmark: "Europe",
  Estonia: "Europe", Finland: "Europe", France: "Europe", Germany: "Europe",
  Greece: "Europe", Hungary: "Europe", Iceland: "Europe", Ireland: "Europe",
  Italy: "Europe", Latvia: "Europe", Lithuania: "Europe", Luxembourg: "Europe",
  Malta: "Europe", Moldova: "Europe", Montenegro: "Europe",
  Netherlands: "Europe", "North Macedonia": "Europe", Norway: "Europe",
  Poland: "Europe", Portugal: "Europe", Romania: "Europe", Serbia: "Europe",
  Slovakia: "Europe", Slovenia: "Europe", Spain: "Europe", Sweden: "Europe",
  Switzerland: "Europe", Ukraine: "Europe", "United Kingdom": "Europe",

  // Subscription regions — US, Canada, Mexico each stand alone
  "United States": "United States",
  Canada: "Canada",
  Mexico: "Mexico",

  // Central America & Caribbean (grouped as "North America" on the map)
  Bahamas: "North America", Barbados: "North America", Belize: "North America",
  "Costa Rica": "North America", Cuba: "North America",
  "Dominican Republic": "North America", "El Salvador": "North America",
  Grenada: "North America", Guatemala: "North America", Haiti: "North America",
  Honduras: "North America", Jamaica: "North America", Nicaragua: "North America",
  Panama: "North America", "Trinidad and Tobago": "North America",
  "Saint Kitts and Nevis": "North America", "Saint Lucia": "North America",
  "Saint Vincent and the Grenadines": "North America",

  // South America
  Argentina: "South America", Bolivia: "South America", Brazil: "South America",
  Chile: "South America", Colombia: "South America", Ecuador: "South America",
  Paraguay: "South America", Peru: "South America", Uruguay: "South America",
  Venezuela: "South America",

  // Oceania
  Australia: "Oceania", "New Zealand": "Oceania",
  Fiji: "Oceania", Kiribati: "Oceania", "Marshall Islands": "Oceania",
  Micronesia: "Oceania", Nauru: "Oceania", Palau: "Oceania",
  "Papua New Guinea": "Oceania", Samoa: "Oceania", "Solomon Islands": "Oceania",
  Tonga: "Oceania", Tuvalu: "Oceania", Vanuatu: "Oceania",
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("ambassadors")
    .select("country")
    .not("country", "is", null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const byContinent: Record<string, number> = {}

  for (const row of data ?? []) {
    const continent = COUNTRY_TO_CONTINENT[row.country] ?? "Other"
    byContinent[continent] = (byContinent[continent] ?? 0) + 1
  }

  return NextResponse.json(
    { total: (data ?? []).length, byContinent },
    { headers: { "Cache-Control": "no-store" } }
  )
}
