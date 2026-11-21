import Link from "next/link";
import { UserCircle2, Camera, Bell } from "lucide-react";

const PARTICIPATION_STEPS = [
  {
    icon: UserCircle2,
    title: "1. Create your free account",
    body: "Register with your email address. No ID documents required — just a valid contact so we can send you updates.",
  },
  {
    icon: Camera,
    title: "2. Document and submit",
    body: "Describe the issue, attach a photograph and pin the location on the map. The form guides you through every field.",
  },
  {
    icon: Bell,
    title: "3. Stay informed",
    body: "Receive status updates as the municipal team acts on your report — from assignment all the way to verified resolution.",
  },
];

export function CitizenParticipationSection() {
  return (
    <section className="border-t border-[#E5E8DF] bg-white py-14 px-4 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-center">

          {/* Left photo */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=75&auto=format&fit=crop"
              alt="Indian resident using mobile phone to report a civic issue"
              className="rounded-md border border-[#E5E8DF] w-full object-cover max-h-[380px]"
              loading="lazy"
            />
          </div>

          {/* Right content */}
          <div className="lg:col-span-3 order-1 lg:order-2 space-y-6">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#788568]">
                Get Involved
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-[#30352D]">
                Residents make the difference
              </h2>
              <p className="mt-3 text-sm text-[#74796F] leading-relaxed">
                Municipal teams cannot see every street every day. Citizens are the first line of
                observation. When you report a problem, you trigger a chain of action that
                otherwise might not happen for weeks.
              </p>
            </div>

            <div className="space-y-4">
              {PARTICIPATION_STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="flex gap-4 items-start">
                    <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-[#F1F3EC] text-[#536247]">
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#30352D]">{step.title}</p>
                      <p className="mt-0.5 text-xs text-[#74796F] leading-relaxed">{step.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center rounded-md bg-[#788568] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#536247] transition-colors"
              >
                Register as Citizen
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center rounded-md border border-[#E5E8DF] bg-white px-5 py-2.5 text-sm font-semibold text-[#30352D] hover:bg-[#F1F3EC] transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
