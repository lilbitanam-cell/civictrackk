import type { Metadata } from "next";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Terms of Use — CivicTrack",
  description: "Terms and conditions for using the CivicTrack municipal grievance portal.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9F5] text-[#30352D]">
      <LandingNavbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-12 space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#536247] bg-[#E9EDE4] px-2 py-0.5 rounded">
            Municipal Policy
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#30352D] mt-2">
            CivicTrack Terms of Use
          </h1>
          <p className="text-xs text-[#74796F] mt-1">Effective Date: January 1, 2026</p>
        </div>

        <div className="bg-white border border-[#E5E8DF] rounded-lg p-6 sm:p-8 space-y-6 text-sm text-[#30352D] leading-relaxed shadow-xs">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#30352D]">1. Purpose of Service</h2>
            <p className="text-[#74796F]">
              CivicTrack is a municipal technology platform designed to facilitate reporting, tracking, and resolution of civic infrastructure defects and municipal services. It is provided free of charge for residents.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#30352D]">2. Citizen User Responsibilities</h2>
            <p className="text-[#74796F]">
              Users agree to provide accurate information when registering grievances. Submitting fraudulent reports, abusive language, non-civic commercial content, or deliberately false coordinates may result in account termination and legal action under local municipal bylaws.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#30352D]">3. Service Level Agreements (SLA)</h2>
            <p className="text-[#74796F]">
              Departmental response and resolution targets depend on the grievance classification, urgency level, and ground operational constraints. While municipal teams make every effort to meet designated SLA timelines, emergency civic events (such as flooding or severe weather) may alter dispatch priorities.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#30352D]">4. Governing Law</h2>
            <p className="text-[#74796F]">
              These terms shall be governed by and construed in accordance with the municipal regulations and laws of India.
            </p>
          </section>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
