import Image from "next/image"
import Link from "next/link"

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-4xl mx-auto p-8 py-16">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-4xl font-bold">About BA Database</h1>
          <Link className="text-sm underline" href="/">
            Home
          </Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm grid md:grid-cols-[260px,1fr] gap-8">
          <div>
            <Image
              src="/sheldon-kozushko.jpg"
              alt="Sheldon Kozushko"
              width={260}
              height={340}
              className="rounded-xl object-cover w-full h-auto"
              priority
            />
          </div>

          <div>
            <h2 className="text-2xl font-semibold">Sheldon Kozushko</h2>
            <p className="text-gray-600 mt-1">Creator of BA Database</p>

            <div className="mt-6 space-y-4 text-gray-700 leading-relaxed">
              <p>
                Sheldon built BA Database after one too many late-night staffing scrambles, when
                finding the right ambassador felt harder than running the event itself.
              </p>
              <p>
                Equal parts operator and builder, he created a place where talented ambassadors can
                be discovered faster and agencies can hire with way less guesswork.
              </p>
              <p>
                Outside of shipping product updates, he is usually refining workflows, testing ideas,
                and making sure the platform stays practical, fast, and genuinely useful for real teams.
              </p>
            </div>

            <p className="mt-8 text-sm text-gray-500">
              This page is a placeholder and can be edited anytime.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
