/**
 * Maps each subscription region to the countries it covers.
 * Region names must match the Stripe product metadata `region` values
 * and the values stored in `agency_subscriptions.subscribed_continents`.
 */

const REGION_COUNTRIES: Record<string, string[]> = {
  "United States": ["United States"],
  Canada: ["Canada"],
  Mexico: ["Mexico"],
  "South America": [
    "Argentina", "Bahamas", "Belize", "Bolivia", "Brazil", "Chile", "Colombia",
    "Costa Rica", "Cuba", "Dominican Republic", "Ecuador", "El Salvador",
    "Guatemala", "Haiti", "Honduras", "Jamaica", "Nicaragua", "Panama",
    "Paraguay", "Peru", "Uruguay", "Venezuela",
  ],
  Europe: [
    "Albania", "Andorra", "Austria", "Belarus", "Belgium",
    "Bosnia and Herzegovina", "Bulgaria", "Croatia", "Cyprus", "Czech Republic",
    "Denmark", "Estonia", "Finland", "France", "Georgia", "Germany", "Greece",
    "Hungary", "Iceland", "Ireland", "Italy", "Latvia", "Lithuania",
    "Luxembourg", "Malta", "Moldova", "Montenegro", "Netherlands",
    "North Macedonia", "Norway", "Poland", "Portugal", "Romania", "Russia",
    "Serbia", "Slovakia", "Slovenia", "Spain", "Sweden", "Switzerland",
    "Turkey", "Ukraine", "United Kingdom",
  ],
  Africa: [
    "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi",
    "Cameroon", "Central African Republic", "Chad", "Congo", "Egypt",
    "Ethiopia", "Gabon", "Ghana", "Guinea", "Kenya", "Libya", "Madagascar",
    "Malawi", "Mali", "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria",
    "Rwanda", "Senegal", "Somalia", "South Africa", "South Sudan", "Sudan",
    "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe",
  ],
  Asia: [
    "Afghanistan", "Armenia", "Azerbaijan", "Bahrain", "Bangladesh", "Brunei",
    "Cambodia", "China", "India", "Indonesia", "Iran", "Iraq", "Israel",
    "Japan", "Jordan", "Kazakhstan", "Kuwait", "Kyrgyzstan", "Laos", "Lebanon",
    "Malaysia", "Mongolia", "Myanmar", "Nepal", "North Korea", "Oman",
    "Pakistan", "Philippines", "Qatar", "Saudi Arabia", "Singapore",
    "South Korea", "Sri Lanka", "Syria", "Taiwan", "Tajikistan", "Thailand",
    "Turkmenistan", "United Arab Emirates", "Uzbekistan", "Vietnam", "Yemen",
  ],
  Oceania: ["Australia", "New Zealand"],
}

/**
 * Given a list of subscribed region names, returns the full list of
 * country names the user is allowed to see.
 */
export function getAllowedCountries(subscribedRegions: string[]): string[] {
  const countries: string[] = []
  for (const region of subscribedRegions) {
    const list = REGION_COUNTRIES[region]
    if (list) countries.push(...list)
  }
  return countries
}
