import type { Metadata } from "next";
import { LandingNavbar } from "@/components/landing/navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { CategoriesSection } from "@/components/landing/categories-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { WhyCivicTrackSection } from "@/components/landing/why-civictrack-section";
import { CitizenParticipationSection } from "@/components/landing/participation-section";
import { FaqSection } from "@/components/landing/faq-section";
import { CtaSection } from "@/components/landing/cta-section";
import { LandingFooter } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "CivicTrack — Report & Resolve Civic Issues in Your Neighbourhood",
  description:
    "Report potholes, water leakages, streetlight outages and more. CivicTrack connects Indian residents with municipal departments for transparent, trackable issue resolution.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9F5] text-[#30352D]">
      <LandingNavbar />
      <main className="flex-1">
        <HeroSection />
        <CategoriesSection />
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
