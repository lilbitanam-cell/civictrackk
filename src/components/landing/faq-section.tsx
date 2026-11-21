"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQ_ITEMS = [
  {
    q: "Is CivicTrack free for residents to use?",
    a: "Yes. CivicTrack is a free public service. Any resident can register, submit complaints, and track their progress without any charge.",
  },
  {
    q: "What happens after I submit a complaint?",
    a: "Your complaint is reviewed by the municipal team, assigned a priority and routed to the appropriate department. You can track the status at any stage — from submission to final resolution.",
  },
  {
    q: "How do I know my issue has been resolved?",
    a: "The issue status is updated to 'Resolved' by the field worker on-site and verified by the administrator. You will see this reflected in your dashboard immediately.",
  },
  {
    q: "What if my complaint is not addressed in a reasonable time?",
    a: "If an issue remains unresolved beyond the departmental service level, it is automatically escalated to the supervisor. You can also raise a follow-up through your complaint dashboard.",
  },
  {
    q: "Can I report anonymously?",
    a: "Currently CivicTrack requires a registered account so we can keep you informed about resolution progress. However, your personal details are not shared publicly — only the issue location and category are visible to municipal staff.",
  },
  {
    q: "Which areas does CivicTrack cover?",
    a: "CivicTrack is designed for integration with any Indian municipal corporation. Coverage depends on the specific municipality that has adopted the platform. Contact your local body to request inclusion.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="border-b border-[#E5E8DF] last:border-b-0">
      <button
        className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-semibold text-[#30352D] hover:text-[#536247] transition-colors"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{q}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 flex-shrink-0 text-[#74796F] transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          open ? "max-h-60 pb-4" : "max-h-0"
        )}
      >
        <p className="text-sm text-[#74796F] leading-relaxed pr-8">{a}</p>
      </div>
    </div>
  );
}

export function FaqSection() {
  return (
    <section className="border-t border-[#E5E8DF] bg-[#F8F9F5] py-14 px-4 sm:px-6">
      <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* Left label */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#788568]">
            FAQs
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-[#30352D]">
            Common questions
          </h2>
          <p className="mt-3 text-sm text-[#74796F] leading-relaxed">
            If your question is not answered here, reach out through the Contact section below.
          </p>
        </div>

        {/* Right accordion */}
        <div className="lg:col-span-2 rounded-md border border-[#E5E8DF] bg-white px-5">
          {FAQ_ITEMS.map((item) => (
            <FaqItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </div>
    </section>
  );
}
