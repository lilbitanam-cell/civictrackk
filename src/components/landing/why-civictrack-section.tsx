import { ShieldCheck, Clock, Users, MessageSquare } from "lucide-react";

const REASONS = [
  {
    icon: ShieldCheck,
    title: "Accountable to Your Ward",
    body: "Every complaint is logged against the specific ward and department. Supervisors can track unresolved issues and act on them.",
  },
  {
    icon: Clock,
    title: "No More Endless Follow-ups",
    body: "Track resolution without repeated calls to the municipal office. The system maintains a full history of every action taken.",
  },
  {
    icon: Users,
    title: "Built for All Residents",
    body: "Designed for ease of use on any device. Submit issues from your phone, tablet or desktop — no technical knowledge needed.",
  },
  {
    icon: MessageSquare,
    title: "Direct Communication Channel",
    body: "Citizens and municipal staff interact on a shared record. Comments, updates and closures are visible to both parties.",
  },
];

export function WhyCivicTrackSection() {
  return (
    <section id="about" className="border-t border-[#E5E8DF] bg-[#F8F9F5] py-14 px-4 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          {/* Left */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#788568]">
              Why CivicTrack
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-[#30352D] max-w-sm">
              Civic engagement that actually works
            </h2>
            <p className="mt-4 text-sm text-[#74796F] leading-relaxed">
              Most civic complaint systems are opaque, slow and frustrating. CivicTrack is designed around a simple
              principle: every resident deserves to know the status of their complaint at any time.
            </p>
            <p className="mt-3 text-sm text-[#74796F] leading-relaxed">
              We built the platform to make municipal teams faster and to give citizens a direct voice — without
              bureaucratic bottlenecks getting in the way.
            </p>

            {/* Photo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1587474260584-136574528ed5?w=700&q=75&auto=format&fit=crop"
              alt="Municipal workers repairing a road"
              className="mt-8 rounded-md border border-[#E5E8DF] w-full max-h-56 object-cover"
              loading="lazy"
            />
          </div>

          {/* Right: reason cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {REASONS.map((r) => {
              const Icon = r.icon;
              return (
                <div
                  key={r.title}
                  className="rounded-md border border-[#E5E8DF] bg-white p-5 space-y-2.5"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#F1F3EC] text-[#536247]">
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-sm font-semibold text-[#30352D]">{r.title}</h3>
                  <p className="text-xs text-[#74796F] leading-relaxed">{r.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
