import Link from "next/link"
import MapLoader from "@/components/MapLoader"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-5xl mx-auto p-8 py-16">
        {/* Header with navigation */}
        <div className="flex items-center justify-end gap-4 mb-12">
          <Link className="text-sm hover:underline" href="/about">
            About
          </Link>
          <Link className="text-sm hover:underline" href="/ba-login">
            Ambassador Login
          </Link>
          <Link className="text-sm hover:underline" href="/login">
            Agency Login
          </Link>
        </div>

        {/* Welcome Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">JOIN THE BA DATABASE</h1>
          <p className="text-xl text-gray-600">
            Get discovered by staffing agencies working with brands all over the world
          </p>
        </div>

        {/* Two cards side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Ambassador Sign Up */}
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-sm flex flex-col">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold mb-3">
                Become a Brand Ambassador
              </h2>
              <p className="text-gray-600">
                Sign up today to get discovered by staffing agencies looking for talented ambassadors like you.
              </p>
            </div>

            <div className="space-y-4 mb-6 flex-1">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold mt-0.5">
                  1
                </div>
                <div>
                  <h3 className="font-medium">Create Your Profile</h3>
                  <p className="text-sm text-gray-600">
                    Share your experience, skills, and availability
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold mt-0.5">
                  2
                </div>
                <div>
                  <h3 className="font-medium">Get Discovered</h3>
                  <p className="text-sm text-gray-600">
                    Appear in our searchable directory for agencies
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold mt-0.5">
                  3
                </div>
                <div>
                  <h3 className="font-medium">Land Opportunities</h3>
                  <p className="text-sm text-gray-600">
                    Connect with brands looking for ambassadors
                  </p>
                </div>
              </div>
            </div>

            <Link
              href="/ba-register"
              className="block w-full bg-black text-white text-center font-semibold py-4 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Sign Up Now
            </Link>

            <p className="text-center text-sm text-gray-500 mt-4">
              Already have an account?{" "}
              <Link href="/ba-login" className="underline hover:text-gray-700">
                Log in here
              </Link>
            </p>
          </div>

          {/* Agency Section */}
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-sm flex flex-col">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold mb-3">
                Are You a Staffing Agency?
              </h2>
              <p className="text-gray-600">
                Get access to our searchable directory of brand ambassadors. Filter by location, skills, availability, and more.
              </p>
            </div>

            <div className="space-y-4 mb-6 flex-1">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-semibold mt-0.5">
                  1
                </div>
                <div>
                  <h3 className="font-medium">Request Access</h3>
                  <p className="text-sm text-gray-600">
                    Tell us about your agency and what regions you need
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-semibold mt-0.5">
                  2
                </div>
                <div>
                  <h3 className="font-medium">Subscribe to Your Region</h3>
                  <p className="text-sm text-gray-600">
                    Choose a regional or worldwide plan
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-semibold mt-0.5">
                  3
                </div>
                <div>
                  <h3 className="font-medium">Search the Directory</h3>
                  <p className="text-sm text-gray-600">
                    Find and connect with ambassadors that fit your needs
                  </p>
                </div>
              </div>
            </div>

            <Link
              href="/request-access"
              className="block w-full bg-white border-2 border-black text-black text-center font-semibold py-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Request Access
            </Link>

            <p className="text-center text-sm text-gray-500 mt-4">
              Already have an account?{" "}
              <Link href="/login" className="underline hover:text-gray-700">
                Agency login
              </Link>
            </p>
          </div>

        </div>

        {/* Live BA Map Dashboard */}
        <div className="mt-12">
          <MapLoader />
        </div>

        {/* Agencies Section */}
        <div className="mt-16">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Trusted by agencies worldwide</p>
            <h2 className="text-2xl font-bold text-gray-900">Staffing Agencies Searching Our Network</h2>
            <p className="text-gray-500 mt-2">These agencies use the BA Database to find talent for their clients.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {[
              { name: "Apex Brand Solutions",      initials: "AB", city: "New York, NY",        bg: "#3B82F6" },
              { name: "Elite Event Staffing",       initials: "EE", city: "Los Angeles, CA",     bg: "#8B5CF6" },
              { name: "Momentum Marketing Group",   initials: "MM", city: "Chicago, IL",         bg: "#F97316" },
              { name: "Pinnacle Promo Network",     initials: "PP", city: "Miami, FL",           bg: "#EF4444" },
              { name: "Catalyst Brand Agency",      initials: "CB", city: "Austin, TX",          bg: "#10B981" },
              { name: "Summit Experiential",        initials: "SE", city: "Toronto, ON",         bg: "#14B8A6" },
              { name: "Vanguard Staffing Co.",      initials: "VS", city: "London, UK",          bg: "#6366F1" },
              { name: "Atlas Event Group",          initials: "AE", city: "Sydney, AU",          bg: "#F59E0B" },
              { name: "Nexus Brand Partners",       initials: "NB", city: "Vancouver, BC",       bg: "#EC4899" },
              { name: "Meridian Staffing Group",    initials: "MS", city: "Dallas, TX",          bg: "#06B6D4" },
            ].map((agency) => (
              <div
                key={agency.name}
                className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow"
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg mb-3 flex-shrink-0"
                  style={{ backgroundColor: agency.bg }}
                >
                  {agency.initials}
                </div>
                <div className="text-sm font-semibold text-gray-800 leading-tight">{agency.name}</div>
                <div className="text-xs text-gray-400 mt-1">{agency.city}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  )
}
