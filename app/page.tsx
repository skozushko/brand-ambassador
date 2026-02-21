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

        {/* Live BA Map Dashboard */}
        <MapLoader />

        {/* Welcome Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">JOIN THE BA DATABASE</h1>
          <p className="text-xl text-gray-600 mb-2">
            Join Our Brand Ambassador Network
          </p>
          <p className="text-gray-500">
            Connect with top brands and exciting opportunities
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
      </div>
    </main>
  )
}
