import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden bg-[#F7F5EE] border-b border-[#DDD9CE]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Editorial masthead dateline */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DDD9CE] py-3 text-[11px] uppercase tracking-[0.18em] text-[#77796F]">
          <span>Municipal Public Ledger &amp; Citizen Dispatch</span>
          <span>Transparent Ward Accountability</span>
        </div>

        {/* Two-column editorial composition */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center py-10 sm:py-14 lg:py-16">
          {/* Left column: Editorial headline & actions */}
          <div className="lg:col-span-6 space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#718267]">
              Civic Journal · Public Works &amp; Neighbourhood Care
            </p>

            <h1 className="font-serif text-[2.25rem] sm:text-[3rem] lg:text-[3.35rem] font-semibold leading-[1.1] tracking-tight text-[#1B3A2E]">
              Every street deserves a{" "}
              <span className="italic font-normal text-[#263D30]">
                documented record
              </span>{" "}
              of care.
            </h1>

            <p className="text-base text-[#77796F] leading-relaxed max-w-lg">
              CivicTrack connects residents directly with municipal departments.
              Report neighbourhood defects, follow field progress in real time,
              and read verified stories of public spaces restored.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/citizen/report"
                className="inline-flex items-center gap-2 rounded-sm bg-[#1B3A2E] px-5 py-3 text-sm font-medium text-[#F7F5EE] hover:bg-[#263D30] transition-colors"
              >
                <span>Report an Issue</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/track"
                className="inline-flex items-center gap-2 rounded-sm border border-[#DDD9CE] bg-[#FAF8F2] px-5 py-3 text-sm font-medium text-[#252820] hover:bg-[#ECE9DF] hover:border-[#718267] transition-colors"
              >
                <Search className="h-4 w-4 text-[#718267]" />
                <span>Track a Report</span>
              </Link>
            </div>

            {/* Editorial footnote strip */}
            <div className="pt-4 border-t border-[#DDD9CE] grid grid-cols-3 gap-4 max-w-md text-xs text-[#77796F]">
              <div>
                <p className="font-semibold text-[#252820]">Direct Routing</p>
                <p className="mt-0.5 text-[11px]">To ward departments</p>
              </div>
              <div>
                <p className="font-semibold text-[#252820]">Audit Trail</p>
                <p className="mt-0.5 text-[11px]">Timestamped updates</p>
              </div>
              <div>
                <p className="font-semibold text-[#252820]">Photo Proof</p>
                <p className="mt-0.5 text-[11px]">Verified on closure</p>
              </div>
            </div>
          </div>

          {/* Right column: Supplied Civic Landscape Illustration */}
          <div className="lg:col-span-6 flex items-center justify-center">
            <div className="w-full max-w-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/illustrations/civic-hero-landscape.png"
                alt="Illustrated civic hall, sunlit park pathway, and neighbourhood greenery"
                className="w-full h-auto max-h-[430px] object-contain mix-blend-multiply select-none"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
