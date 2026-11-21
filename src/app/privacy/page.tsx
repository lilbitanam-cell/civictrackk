import type { Metadata } from "next";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Privacy Policy — CivicTrack",
  description: "Official privacy practices for CivicTrack municipal services platform.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9F5] text-[#30352D]">
      <LandingNavbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-12 space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#536247] bg-[#E9EDE4] px-2 py-0.5 rounded">
            Municipal Policy
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#30352D] mt-2">
            CivicTrack Privacy Policy
          </h1>
          <p className="text-xs text-[#74796F] mt-1">Effective Date: January 1, 2026</p>
        </div>

        <div className="bg-white border border-[#E5E8DF] rounded-lg p-6 sm:p-8 space-y-6 text-sm text-[#30352D] leading-relaxed shadow-xs">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#30352D]">1. Information We Collect</h2>
            <p className="text-[#74796F]">
              CivicTrack collects information required to process and resolve municipal grievances submitted by citizens, including:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[#74796F]">
              <li>Contact details: Name, email address, and optional phone number.</li>
              <li>Grievance details: Issue description, category, and attached photographs.</li>
              <li>Location data: Physical street address, ward name, and map coordinates.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#30352D]">2. How We Use Information</h2>
            <p className="text-[#74796F]">
              Collected data is utilized strictly for municipal administrative purposes:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[#74796F]">
              <li>Routing complaints to the appropriate municipal department and field workers.</li>
              <li>Transmitting status updates and resolution notifications to the complainant.</li>
              <li>Generating municipal performance metrics and geospatial service heatmaps.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#30352D]">3. Data Security & Storage</h2>
            <p className="text-[#74796F]">
              All data is stored securely using enterprise cloud infrastructure with role-based access control. Citizens can view only their own filed complaints, while field workers and municipal staff access only assigned operational data.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#30352D]">4. Contact Helpdesk</h2>
            <p className="text-[#74796F]">
              For privacy-related questions or data deletion requests, contact the municipal helpdesk at <strong className="text-[#30352D]">support@civictrack.in</strong>.
            </p>
          </section>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
