import type { Metadata } from "next";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";
import TrackReportClient from "./TrackReportClient";

export const metadata: Metadata = {
  title: "Track a Report — CivicTrack",
  description:
    "Look up the real-time status, assigned department, official updates, and resolution evidence for any CivicTrack complaint reference.",
};

export default async function TrackReportPage({
  searchParams,
}: {
  searchParams: Promise<{ ticket?: string }>;
}) {
  const { ticket } = await searchParams;

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5EE] text-[#252820]">
      <LandingNavbar />

      <main className="flex-1 py-12 sm:py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pb-6 border-b border-[#DDD9CE]">
            <div className="md:col-span-7 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#718267]">
                Public Verification Ledger
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-[#1B3A2E]">
                Track a Civic Report
              </h1>
              <p className="text-sm text-[#77796F] leading-relaxed">
                Enter your complaint reference number to view current municipal
                status, departmental routing, progress timeline, and verified
                completion photos.
              </p>
            </div>
            <div className="md:col-span-5 flex justify-start md:justify-end">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/images/Watercolor Cityscape Banner.png"
                alt="Illustrated municipal scroll banner"
                className="w-full max-w-xs h-auto object-contain mix-blend-multiply select-none"
              />
            </div>
          </div>

          <TrackReportClient initialTicket={ticket || ""} />
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
