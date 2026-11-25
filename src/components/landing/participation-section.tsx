import Link from "next/link";
import { UserCircle2, Camera, Bell, ArrowRight } from "lucide-react";

const PARTICIPATION_STEPS = [
  {
    icon: UserCircle2,
    title: "1. Register your resident account",
    body: "Sign up in seconds with your email address or Google account so updates reach you reliably.",
  },
  {
    icon: Camera,
    title: "2. Document the location & defect",
    body: "Describe the issue, attach on-site photographs, and place a pin at the exact street coordinate.",
  },
  {
    icon: Bell,
    title: "3. Follow verified resolution",
    body: "Receive progress alerts as municipal teams review, dispatch, and upload proof of repair.",
  },
];

export function CitizenParticipationSection() {
  return (
    <section className="relative overflow-hidden bg-[#F7F5EE] py-16 sm:py-20 px-4 sm:px-6 border-b border-[#DDD9CE]">
      {/* Delicate olive branch botanical illustration near editorial transition */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/images/Hand-Drawn Olive Green Branch.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none select-none hidden xl:block absolute -top-2 right-0 w-[300px] h-auto object-contain mix-blend-multiply opacity-75"
      />
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left editorial callout card */}
          <div className="lg:col-span-5 border border-[#DDD9CE] bg-[#FAF8F2] p-7 space-y-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#718267]">
              Citizen Participation
            </p>
            <h3 className="font-serif text-2xl font-semibold text-[#1B3A2E] leading-snug">
              &ldquo;Civic infrastructure improves fastest when residents and
              field teams share a single ledger.&rdquo;
            </h3>
            <p className="text-xs text-[#77796F] leading-relaxed">
              Municipal inspectors cannot patrol every lane daily. Local
              observation turns isolated defects into actionable work orders.
            </p>
            <div className="pt-2 border-t border-[#DDD9CE] flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 rounded-sm bg-[#1B3A2E] px-4 py-2.5 text-xs font-medium text-[#F7F5EE] hover:bg-[#263D30] transition-colors"
              >
                Register as Resident
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/stories"
                className="inline-flex items-center rounded-sm border border-[#DDD9CE] bg-[#F7F5EE] px-4 py-2.5 text-xs font-medium text-[#252820] hover:bg-[#ECE9DF] transition-colors"
              >
                Read Civic Stories
              </Link>
            </div>
          </div>

          {/* Right steps */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#718267]">
                Participating in Your Ward
              </p>
              <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-[#1B3A2E]">
                Three minutes to document a lasting fix
              </h2>
            </div>

            <div className="divide-y divide-[#DDD9CE] border-t border-b border-[#DDD9CE]">
              {PARTICIPATION_STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="py-4 flex gap-4 items-start">
                    <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-sm border border-[#DDD9CE] bg-[#FAF8F2] text-[#1B3A2E]">
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#252820]">{step.title}</p>
                      <p className="mt-1 text-xs text-[#77796F] leading-relaxed">{step.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
