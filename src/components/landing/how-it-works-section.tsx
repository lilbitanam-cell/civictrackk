import { FilePlus, ClipboardCheck, Wrench } from "lucide-react";

const STEPS = [
  {
    number: "01",
    icon: FilePlus,
    title: "Report an Issue",
    body: "Register as a citizen and submit your complaint with a description, photograph, and location. Takes less than two minutes.",
  },
  {
    number: "02",
    icon: ClipboardCheck,
    title: "Review & Assignment",
    body: "Municipal administrators receive, review and triage the complaint. The issue is assigned to the relevant department and field team.",
  },
  {
    number: "03",
    icon: Wrench,
    title: "Resolution & Tracking",
    body: "Field workers resolve the issue on-site and update the status. You receive verified updates at every stage until closure.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="border-t border-[#E5E8DF] bg-white py-14 px-4 sm:px-6">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-10 max-w-xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#788568]">
            Process Overview
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-[#30352D]">
            How CivicTrack works
          </h2>
          <p className="mt-2.5 text-sm text-[#74796F] leading-relaxed">
            A simple three-step process connects your complaint to the right department and keeps you informed until it is resolved.
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connector line (desktop only) */}
          <div className="hidden md:block absolute top-[2.1rem] left-[calc(16.66%+1.5rem)] right-[calc(16.66%+1.5rem)] h-px bg-[#E5E8DF] z-0" />

          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="relative z-10 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  {/* Step icon */}
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md border border-[#E5E8DF] bg-white shadow-none">
                    <Icon className="h-5 w-5 text-[#788568]" strokeWidth={1.75} />
                  </div>
                  <span className="text-xs font-bold tracking-widest text-[#B4BBA5]">
                    STEP {step.number}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#30352D]">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-[#74796F] leading-relaxed">{step.body}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Thin rule */}
        <div className="mt-12 border-t border-[#E5E8DF]" />

        {/* Process detail band */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Realistic ticket mockup — static visual, no fake data */}
          <div className="rounded-md border border-[#E5E8DF] bg-[#F8F9F5] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#30352D]">Issue Ticket</span>
              <span className="rounded-sm border border-[#E5E8DF] bg-white px-2 py-0.5 text-[10px] font-semibold text-[#536247]">
                IN PROGRESS
              </span>
            </div>
            <div className="border-t border-[#E5E8DF] pt-3 space-y-2">
              <div>
                <p className="text-[10px] text-[#74796F] uppercase tracking-wider">Category</p>
                <p className="text-xs font-medium text-[#30352D] mt-0.5">Roads & Potholes</p>
              </div>
              <div>
                <p className="text-[10px] text-[#74796F] uppercase tracking-wider">Location</p>
                <p className="text-xs font-medium text-[#30352D] mt-0.5">Near Bus Stop, Nehru Market Road</p>
              </div>
              <div>
                <p className="text-[10px] text-[#74796F] uppercase tracking-wider">Assigned Department</p>
                <p className="text-xs font-medium text-[#30352D] mt-0.5">PWD — Roads Division</p>
              </div>
            </div>
            <div className="border-t border-[#E5E8DF] pt-3">
              <p className="text-[10px] text-[#74796F] uppercase tracking-wider mb-2">Progress</p>
              <div className="flex gap-2 items-center">
                {["Submitted", "Reviewed", "Assigned", "In Progress", "Resolved"].map((s, i) => (
                  <div key={s} className="flex flex-col items-center gap-1">
                    <div className={`h-2 w-2 rounded-full ${i <= 3 ? "bg-[#788568]" : "bg-[#E5E8DF]"}`} />
                    {i < 4 && <div className={`hidden sm:block h-px w-6 ${i < 3 ? "bg-[#788568]" : "bg-[#E5E8DF]"}`} style={{ position: "relative", top: "-0.6rem", marginLeft: "0.5rem" }} />}
                  </div>
                ))}
              </div>
              <div className="flex gap-1.5 flex-wrap mt-2">
                {["Submitted", "Reviewed", "Assigned", "In Progress", "Resolved"].map((s, i) => (
                  <span key={s} className={`text-[10px] ${i <= 3 ? "text-[#536247] font-semibold" : "text-[#B4BBA5]"}`}>{s}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-[#30352D]">
              Every ticket is traceable from submission to closure
            </h3>
            <p className="text-sm text-[#74796F] leading-relaxed">
              Once you submit an issue, it enters a transparent workflow. Municipal staff triage and assign it.
              Field workers update status on-site. You can view the current state at any time — no need to call anyone.
            </p>
            <ul className="space-y-2.5">
              {[
                "No follow-up phone calls required",
                "Automatic routing to the right department",
                "Live status visible to the citizen at all times",
                "Closed only after verified on-site resolution",
              ].map((point) => (
                <li key={point} className="flex items-start gap-2 text-sm text-[#30352D]">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#788568]" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
