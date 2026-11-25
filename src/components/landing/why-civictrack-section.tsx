import { ShieldCheck, Clock, Users, MessageSquare } from "lucide-react";

const REASONS = [
  {
    icon: ShieldCheck,
    title: "Accountable to Every Ward",
    body: "Complaints are logged against specific wards and municipal departments so supervisors can identify bottlenecks early.",
  },
  {
    icon: Clock,
    title: "Transparent Progress History",
    body: "Every status transition, assignment, and remark is recorded chronologically — eliminating repeated office visits.",
  },
  {
    icon: Users,
    title: "Accessible on Any Device",
    body: "Clear language, low-bandwidth image compression, and map pinning designed for everyday residents.",
  },
  {
    icon: MessageSquare,
    title: "Shared Operational Record",
    body: "Residents, field technicians, and administrators read from the same verified source of truth.",
  },
];

export function WhyCivicTrackSection() {
  return (
    <section
      id="about"
      className="relative overflow-hidden bg-[#ECE9DF]/45 py-16 sm:py-20 px-4 sm:px-6 border-b border-[#DDD9CE]"
    >
      {/* Subtle botanical branch accent near editorial transition */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/images/Hand-Drawn Olive Green Branch.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none select-none hidden xl:block absolute -top-2 right-0 w-[300px] h-auto object-contain mix-blend-multiply opacity-70"
      />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left editorial essay */}
          <div className="lg:col-span-5 space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#718267]">
              Neighbourhood Impact &amp; Purpose
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-[#1B3A2E] leading-tight">
              Public stewardship built on visibility
            </h2>
            <p className="text-sm text-[#77796F] leading-relaxed">
              Most municipal complaint channels disappear into unindexed ledgers.
              CivicTrack treats every report as a civic dispatch — visible,
              attributable, and documented through verified field closure.
            </p>
            <p className="text-sm text-[#77796F] leading-relaxed">
              When residents see repairs documented openly across neighbouring
              streets, trust in local institutions grows organically.
            </p>
          </div>

          {/* Right: 2x2 editorial principles */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 border-t border-l border-[#DDD9CE]">
            {REASONS.map((r) => {
              const Icon = r.icon;
              return (
                <div
                  key={r.title}
                  className="border-r border-b border-[#DDD9CE] bg-[#FAF8F2] p-6 space-y-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-[#DDD9CE] bg-[#F7F5EE] text-[#1B3A2E]">
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-[#252820]">
                    {r.title}
                  </h3>
                  <p className="text-xs text-[#77796F] leading-relaxed">
                    {r.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
