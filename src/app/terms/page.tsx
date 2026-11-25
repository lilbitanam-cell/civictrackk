import type { Metadata } from "next";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Terms of Use — CivicTrack",
  description: "Terms and conditions for using the CivicTrack municipal grievance portal.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5EE] text-[#252820]">
      <LandingNavbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-12 space-y-8">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#718267]">
            Municipal Policy
          </span>
          <h1 className="font-serif text-3xl font-semibold text-[#1B3A2E] mt-2">
            CivicTrack Terms of Use
          </h1>
          <p className="text-xs text-[#77796F] mt-1">Effective Date: January 1, 2026</p>
        </div>

        <div className="bg-[#FAF8F2] border border-[#DDD9CE] rounded-sm p-6 sm:p-8 space-y-6 text-sm text-[#252820] leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-serif text-lg font-semibold text-[#1B3A2E]">1. Purpose of Service</h2>
            <p className="text-[#77796F]">
              CivicTrack is a municipal technology platform designed to facilitate reporting, tracking, and resolution of civic infrastructure defects and municipal services. It is provided free of charge for residents.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-semibold text-[#1B3A2E]">2. Citizen User Responsibilities</h2>
            <p className="text-[#77796F]">
              Users agree to provide accurate information when registering grievances. Submitting fraudulent reports, abusive language, non-civic commercial content, or deliberately false coordinates may result in account termination under municipal bylaws.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-semibold text-[#1B3A2E]">3. Service Level Agreements (SLA)</h2>
            <p className="text-[#77796F]">
              Departmental response and resolution targets depend on grievance classification, urgency level, and ground operational constraints. Emergency civic events may alter dispatch priorities.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-semibold text-[#1B3A2E]">4. Governing Law</h2>
            <p className="text-[#77796F]">
              These terms shall be governed by and construed in accordance with applicable municipal regulations and laws of India.
            </p>
          </section>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
