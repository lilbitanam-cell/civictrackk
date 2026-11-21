import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden bg-white">
      {/* Two-column layout on large screens */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[520px]">

          {/* Left: Text content */}
          <div className="flex flex-col justify-center py-14 lg:py-20 lg:pr-10">
            {/* Eyebrow */}
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-sm border border-[#E5E8DF] bg-[#F1F3EC] px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#788568]"></span>
              <span className="text-xs font-semibold tracking-wide text-[#536247] uppercase">
                Civic Participation Platform
              </span>
            </div>

            <h1 className="text-[2rem] sm:text-[2.5rem] font-bold leading-[1.15] tracking-tight text-[#30352D]">
              Better Neighbourhoods<br />
              <span className="text-[#536247]">Start With Your Voice.</span>
            </h1>

            <p className="mt-5 text-base text-[#74796F] leading-relaxed max-w-lg">
              Report civic issues, track their progress and help build cleaner, safer and
              better-connected communities — directly with your municipal corporation.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-md bg-[#788568] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#536247] transition-colors"
              >
                Report an Issue
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-md border border-[#E5E8DF] bg-white px-5 py-2.5 text-sm font-semibold text-[#30352D] hover:bg-[#F1F3EC] transition-colors"
              >
                How It Works
                <ChevronDown className="h-4 w-4 text-[#74796F]" />
              </a>
            </div>

            {/* Trust signals */}
            <div className="mt-10 flex flex-wrap items-center gap-4 text-xs text-[#74796F]">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#788568]"></span>
                Free for residents
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#788568]"></span>
                No app download needed
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#788568]"></span>
                Track resolution in real time
              </div>
            </div>
          </div>

          {/* Right: Photograph */}
          <div className="relative hidden lg:flex items-center justify-center py-10">
            {/* Authentic Indian neighbourhood photo via Unsplash */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80&auto=format&fit=crop"
              alt="Indian neighbourhood street with infrastructure"
              className="h-full w-full max-h-[440px] object-cover rounded-md border border-[#E5E8DF]"
              loading="eager"
            />
            {/* Overlay badge */}
            <div className="absolute bottom-14 left-4 rounded-md border border-[#E5E8DF] bg-white p-3 shadow-sm max-w-[200px]">
              <p className="text-[11px] font-semibold text-[#30352D]">Issue Reported & Resolved</p>
              <p className="text-[10px] text-[#74796F] mt-0.5">Pothole — MG Road, Sector 12</p>
              <div className="mt-2 inline-flex items-center gap-1 rounded-sm bg-[#E9EDE4] px-1.5 py-0.5 text-[10px] font-semibold text-[#3E4B37]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#536247]"></span>
                Resolved in 4 days
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#E5E8DF]" />
    </section>
  );
}
