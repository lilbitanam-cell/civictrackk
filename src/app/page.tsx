export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { LandingNavbar } from "@/components/landing/navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { StatsBand } from "@/components/landing/stats-band";
import { CategoriesSection } from "@/components/landing/categories-section";
import { CivicStoriesSection } from "@/components/landing/civic-stories-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { WhyCivicTrackSection } from "@/components/landing/why-civictrack-section";
import { CitizenParticipationSection } from "@/components/landing/participation-section";
import { FaqSection } from "@/components/landing/faq-section";
import { CtaSection } from "@/components/landing/cta-section";
import { LandingFooter } from "@/components/landing/footer";
import { getPublicCivicJournalDataServer } from "@/services/server/complaints.server";

export const metadata: Metadata = {
  title: "CivicTrack — The Civic Journal & Neighbourhood Issue Ledger",
  description:
    "Report potholes, water leakages, streetlight outages, and sanitation issues. Follow verified municipal progress and documented Civic Stories.",
};

export default async function LandingPage() {
  const journalData = await getPublicCivicJournalDataServer();

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5EE] text-[#252820]">
      <LandingNavbar />
      <main className="flex-1">
        <HeroSection />
        <StatsBand stats={journalData.stats} />
        <CategoriesSection />
        <CivicStoriesSection />
        <HowItWorksSection />
        <WhyCivicTrackSection />
        <CitizenParticipationSection />
        <FaqSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
