import Link from "next/link"
import { getSupabase } from "@/lib/supabase"
import RevealContact from "./reveal-contact"

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = getSupabase()
  const { id } = await params

  const { data: ambassador, error } = await supabase
    .from("ambassadors_directory")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !ambassador) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">Ambassador Not Found</h1>
        <div className="mt-4 text-gray-600">
          The ambassador you're looking for doesn't exist or has been removed.
        </div>
        <Link className="underline mt-4 inline-block" href="/directory">
          ← Back to Directory
        </Link>
        {error && (
          <pre className="mt-4 text-sm text-red-600">
            {JSON.stringify(error, null, 2)}
          </pre>
        )}
      </main>
    )
  }

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link className="underline text-sm" href="/directory">
          ← Back to Directory
        </Link>
      </div>

      <div className="border rounded-lg p-6">
        {/* Header section */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{ambassador.full_name}</h1>
            <div className="text-gray-600 mt-2">
              {ambassador.city && `${ambassador.city}, `}
              {ambassador.state_region && `${ambassador.state_region}, `}
              {ambassador.country}
            </div>
          </div>

          <div className="text-right text-gray-600">
            <div>{ambassador.experience_level}</div>
            <div className="mt-1">{ambassador.availability_status}</div>
          </div>
        </div>

        {/* Bio */}
        {ambassador.bio && (
          <div className="mt-6">
            <h2 className="font-semibold mb-2">About</h2>
            <p className="text-gray-700">{ambassador.bio}</p>
          </div>
        )}

        {/* Roles, Skills, Languages - FULL LIST */}
        {((ambassador.role_names ?? []).length > 0 ||
          (ambassador.skill_names ?? []).length > 0 ||
          (ambassador.language_names ?? []).length > 0) && (
          <div className="mt-6">
            <h2 className="font-semibold mb-3">Roles, Skills & Languages</h2>
            <div className="flex flex-wrap gap-2">
              {(ambassador.role_names ?? []).map((name: string) => (
                <span
                  key={`r-${name}`}
                  className="text-sm border border-blue-300 bg-blue-50 rounded-full px-3 py-1"
                >
                  {name}
                </span>
              ))}
              {(ambassador.skill_names ?? []).map((name: string) => (
                <span
                  key={`s-${name}`}
                  className="text-sm border border-green-300 bg-green-50 rounded-full px-3 py-1"
                >
                  {name}
                </span>
              ))}
              {(ambassador.language_names ?? []).map((name: string) => (
                <span
                  key={`l-${name}`}
                  className="text-sm border border-purple-300 bg-purple-50 rounded-full px-3 py-1"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Additional details */}
        {(ambassador.has_vehicle !== null ||
          ambassador.willing_to_travel !== null ||
          ambassador.can_work_weekends !== null ||
          ambassador.can_work_nights !== null) && (
          <div className="mt-6">
            <h2 className="font-semibold mb-3">Additional Information</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {ambassador.has_vehicle !== null && (
                <div>
                  <span className="font-medium">Has Vehicle:</span>{" "}
                  {ambassador.has_vehicle ? "Yes" : "No"}
                </div>
              )}
              {ambassador.willing_to_travel !== null && (
                <div>
                  <span className="font-medium">Willing to Travel:</span>{" "}
                  {ambassador.willing_to_travel ? "Yes" : "No"}
                </div>
              )}
              {ambassador.can_work_weekends !== null && (
                <div>
                  <span className="font-medium">Can Work Weekends:</span>{" "}
                  {ambassador.can_work_weekends ? "Yes" : "No"}
                </div>
              )}
              {ambassador.can_work_nights !== null && (
                <div>
                  <span className="font-medium">Can Work Nights:</span>{" "}
                  {ambassador.can_work_nights ? "Yes" : "No"}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Contact Reveal Component */}
      <div className="mt-6">
        <RevealContact ambassadorId={id} />
      </div>
    </main>
  )
}
