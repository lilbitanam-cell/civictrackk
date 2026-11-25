import Link from "next/link";
import {
  FilePlus,
  ClipboardCheck,
  Wrench,
  ArrowRight,
  CheckCircle2,
  Search,
} from "lucide-react";

const STEPS = [
  {
    number: "01",
    actor: "By Resident",
    icon: FilePlus,
    title: "Document & File",
    body: "Capture a concise report with on-site photographs, ward location, and map pin. A permanent reference ticket is issued immediately.",
  },
  {
    number: "02",
    actor: "Municipal Desk",
    icon: ClipboardCheck,
    title: "Triage & Dispatch",
    body: "Supervisors verify location particulars, calibrate urgency, and route the work order directly to the responsible municipal crew.",
  },
  {
    number: "03",
    actor: "Field & Audit",
    icon: Wrench,
    title: "Verify & Archive",
    body: "Field teams upload completion photographs from the site. Tickets close only after administrative inspection, preserving a lasting record.",
  },
];

const PIPELINE_STAGES = [
  {
    code: "01",
    label: "Submitted",
    detail: "Ticket issued & desk alerted",
  },
  {
    code: "02",
    label: "Under Review",
    detail: "Scope & ward confirmed",
  },
  {
    code: "03",
    label: "Assigned",
    detail: "Crew & division dispatched",
  },
  {
    code: "04",
    label: "In Progress",
    detail: "On-site repair underway",
  },
  {
    code: "05",
    label: "Resolved",
    detail: "Proof audited & archived",
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="bg-[#F7F5EE] py-16 sm:py-20 px-4 sm:px-6 border-b border-[#DDD9CE]"
    >
      <div className="mx-auto max-w-6xl space-y-12">
        {/* Editorial Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#DDD9CE]">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#718267]">
              Process &amp; Accountability
            </p>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-[#1B3A2E]">
              How CivicTrack works
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#77796F] leading-relaxed">
              A three-stage civic ledger connecting neighbourhood observations to
              verified municipal repairs — with every handoff timestamped.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/citizen/report"
              className="inline-flex items-center gap-2 rounded-sm bg-[#1B3A2E] px-4 py-2 text-xs font-medium text-[#F7F5EE] hover:bg-[#263D30] transition-colors"
            >
              <span>File a Report</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/track"
              className="inline-flex items-center gap-1.5 rounded-sm border border-[#DDD9CE] bg-[#FAF8F2] px-4 py-2 text-xs font-medium text-[#252820] hover:bg-[#ECE9DF] transition-colors"
            >
              <Search className="h-3.5 w-3.5 text-[#718267]" />
              <span>Track Ticket</span>
            </Link>
          </div>
        </div>

        {/* Three Editorial Stage Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 border-t border-l border-[#DDD9CE]">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="flex flex-col justify-between gap-6 border-r border-b border-[#DDD9CE] bg-[#FAF8F2] p-6 sm:p-8"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-3xl font-semibold text-[#1B3A2E]/85">
                      {step.number}
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-[#DDD9CE] bg-[#F7F5EE] text-[#1B3A2E]">
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-serif text-xl font-semibold text-[#252820]">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm text-[#77796F] leading-relaxed">
                      {step.body}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#DDD9CE] flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-[#718267] font-medium">
                  <span>Stage {step.number}</span>
                  <span>{step.actor}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Public Verification & Horizontal 5-Stage Ledger */}
        <div className="border border-[#DDD9CE] bg-[#FAF8F2]">
          {/* Top bar: 5 connected milestones */}
          <div className="border-b border-[#DDD9CE] bg-[#ECE9DF]/45 p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1B3A2E]">
                Audited Workflow Pipeline
              </p>
              <span className="font-mono text-[11px] text-[#77796F]">
                5 Verified Checkpoints
              </span>
            </div>

            <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {PIPELINE_STAGES.map((stage, idx) => {
                const isFinal = idx === PIPELINE_STAGES.length - 1;
                return (
                  <div
                    key={stage.code}
                    className="relative border border-[#DDD9CE] bg-[#F7F5EE] p-4 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-semibold text-[#718267]">
                        {stage.code}
                      </span>
                      {isFinal ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#2D5A3F]" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-[#1B3A2E]/70" />
                      )}
                    </div>
                    <p className="font-serif text-base font-semibold text-[#252820]">
                      {stage.label}
                    </p>
                    <p className="text-xs text-[#77796F] leading-snug">
                      {stage.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom split: Verification Callout + Cityscape Parchment Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center p-6 sm:p-8">
            <div className="lg:col-span-7 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#718267]">
                Public Verification
              </p>
              <h3 className="font-serif text-2xl font-semibold text-[#1B3A2E] leading-snug">
                Every filing carries a permanent, timestamped audit trail
              </h3>
              <p className="text-sm text-[#77796F] leading-relaxed max-w-xl">
                Residents and municipal supervisors read from the exact same
                operational record — from initial photographs through field
                verification — using the ticket reference number.
              </p>
              <div className="pt-1">
                <Link
                  href="/track"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1B3A2E] hover:underline"
                >
                  <span>Look up a ticket reference</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/images/Watercolor Cityscape Banner.png"
                alt="Illustrated civic ledger scroll with domed municipal landmark and foliage"
                className="w-full max-w-sm h-auto object-contain mix-blend-multiply select-none"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
