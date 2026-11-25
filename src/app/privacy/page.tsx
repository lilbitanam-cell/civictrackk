import type { Metadata } from "next";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Privacy Policy — CivicTrack",
  description: "Official privacy practices for CivicTrack municipal services platform.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5EE] text-[#252820]">
      <LandingNavbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-12 space-y-8">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#718267]">
            Municipal Policy
          </span>
          <h1 className="font-serif text-3xl font-semibold text-[#1B3A2E] mt-2">
            CivicTrack Privacy Policy
          </h1>
          <p className="text-xs text-[#77796F] mt-1">Effective Date: January 1, 2026</p>
        </div>

        <div className="bg-[#FAF8F2] border border-[#DDD9CE] rounded-sm p-6 sm:p-8 space-y-6 text-sm text-[#252820] leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-serif text-lg font-semibold text-[#1B3A2E]">1. Information We Collect</h2>
            <p className="text-[#77796F]">
              CivicTrack collects information required to process and resolve municipal grievances submitted by citizens, including:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[#77796F]">
              <li>Contact details: Name, email address, and optional phone number.</li>
              <li>Grievance details: Issue description, category, and attached photographs.</li>
              <li>Location data: Physical street address, ward name, and map coordinates.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-semibold text-[#1B3A2E]">2. How We Use Information</h2>
            <p className="text-[#77796F]">
              Collected data is utilized strictly for municipal administrative purposes:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[#77796F]">
              <li>Routing complaints to the appropriate municipal department and field workers.</li>
              <li>Transmitting status updates and resolution notifications to the complainant.</li>
              <li>Generating municipal performance metrics and geospatial service heatmaps.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-semibold text-[#1B3A2E]">3. Data Security &amp; Storage</h2>
            <p className="text-[#77796F]">
              All data is stored securely using enterprise cloud infrastructure with role-based access control. Personal contact details are never displayed on public Civic Stories or ticket tracking lookups.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-semibold text-[#1B3A2E]">4. Contact Helpdesk</h2>
            <p className="text-[#77796F]">
              For privacy-related questions or data deletion requests, contact the municipal helpdesk at <strong className="text-[#252820]">support@civictrack.in</strong>.
            </p>
          </section>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
