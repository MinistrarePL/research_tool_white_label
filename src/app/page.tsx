import { Card } from "flowbite-react";
import Link from "next/link";
import { HiArrowRight, HiViewGrid, HiCollection, HiCursorClick } from "react-icons/hi";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            UX Research Tool
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Conduct Card Sorting, Tree Testing, and First-Click studies.
            Self-hosted, open-source, and privacy-friendly.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center px-6 py-3 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300"
            >
              Sign In
              <HiArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-white/10 border-white/20">
            <div className="text-purple-400 mb-4">
              <HiViewGrid className="h-12 w-12" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Card Sorting
            </h3>
            <p className="text-gray-300">
              Understand how users categorize and organize content. Supports
              both open and closed card sorting.
            </p>
          </Card>

          <Card className="bg-white/10 border-white/20">
            <div className="text-blue-400 mb-4">
              <HiCollection className="h-12 w-12" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Tree Testing
            </h3>
            <p className="text-gray-300">
              Validate your information architecture. See if users can find
              items in your navigation structure.
            </p>
          </Card>

          <Card className="bg-white/10 border-white/20">
            <div className="text-green-400 mb-4">
              <HiCursorClick className="h-12 w-12" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              First-Click Testing
            </h3>
            <p className="text-gray-300">
              Test where users click first on your designs. Visualize results
              with heatmaps.
            </p>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-400 text-sm">
            Built with Next.js, Prisma, and Flowbite React
          </p>
        </div>
      </div>
    </div>
  );
}
