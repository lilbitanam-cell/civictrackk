"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Minus, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQ_ITEMS = [
  {
    code: "01",
    q: "Is CivicTrack free for residents to use?",
    a: "Yes. CivicTrack is a public-service civic platform. Residents can register, submit neighbourhood reports, attach photographs, and track progress at no cost.",
  },
  {
    code: "02",
    q: "What happens immediately after I submit a grievance?",
    a: "Your report is assigned a unique reference number (such as CT-202611-XXXX), logged in the municipal queue, triaged by supervisors, and dispatched to the responsible department.",
  },
  {
    code: "03",
    q: "Can I check the status of a report without logging in?",
    a: "Yes. Visit the Track a Report page and enter your ticket reference number to view the current status, assigned division, chronological timeline, and resolution photos.",
  },
  {
    code: "04",
    q: "How does CivicTrack verify that work was actually completed?",
    a: "Field technicians must upload on-site completion photographs alongside technical notes. A complaint is marked Resolved only after supervisory administrative audit.",
  },
  {
    code: "05",
    q: "Is my phone number or personal identity exposed publicly?",
    a: "No. Personal contact information such as your phone number or email address is kept strictly within authorized municipal workflows and never exposed on public lookup pages.",
  },
];

function FaqItem({
  code,
  q,
  a,
  isOpen,
  onToggle,
}: {
  code: string;
  q: string;
  a: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        "border-b border-[#DDD9CE] last:border-b-0 transition-colors",
        isOpen ? "bg-[#ECE9DF]/45" : "bg-[#FAF8F2] hover:bg-[#ECE9DF]/25"
      )}
    >
      <button
        type="button"
        className="flex w-full items-start justify-between gap-4 px-5 sm:px-6 py-5 text-left cursor-pointer"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <div className="flex items-baseline gap-3.5 min-w-0">
          <span className="font-mono text-xs font-medium text-[#718267] shrink-0">
            {code}
          </span>
          <span className="font-serif text-base sm:text-lg font-medium text-[#252820] leading-snug">
            {q}
          </span>
        </div>
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-[#DDD9CE] bg-[#F7F5EE] text-[#1B3A2E]">
          {isOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
        </span>
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isOpen ? "max-h-60 pb-5" : "max-h-0"
        )}
      >
        <p className="pl-12 sm:pl-14 pr-6 text-sm text-[#77796F] leading-relaxed">
          {a}
        </p>
      </div>
    </div>
  );
}

export function FaqSection() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  return (
    <section
      id="faq"
      className="relative overflow-hidden bg-[#FAF8F2] py-16 sm:py-20 px-4 sm:px-6 border-b border-[#DDD9CE]"
    >
      {/* Top-right botanical branch positioned along its natural upper-right edge */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/illustrations/civic-tree-canopy.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none select-none hidden xl:block absolute -top-2 right-0 w-[300px] h-auto object-contain mix-blend-multiply opacity-65"
        loading="lazy"
      />

      <div className="relative z-10 mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
        {/* Left editorial column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#718267]">
              Public Guidance · FAQs
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-[#1B3A2E]">
              Common questions
            </h2>
            <p className="text-sm text-[#77796F] leading-relaxed">
              Clear answers on filing neighbourhood reports, tracking departmental
              action, and how public resolution verification works.
            </p>
          </div>

          <div className="border border-[#DDD9CE] bg-[#F7F5EE] p-5 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1B3A2E]">
              Need quick access?
            </p>
            <p className="text-xs text-[#77796F] leading-relaxed">
              Check an existing ticket reference anytime, or sign in to submit
              a documented report in your ward.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href="/track"
                className="inline-flex items-center gap-1 text-xs font-medium text-[#1B3A2E] hover:underline"
              >
                Track a Report <ArrowRight className="h-3 w-3" />
              </Link>
              <Link
                href="/citizen/report"
                className="inline-flex items-center gap-1 text-xs font-medium text-[#718267] hover:text-[#1B3A2E]"
              >
                Report an Issue <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right indexed accordion ledger */}
        <div className="lg:col-span-8 border border-[#DDD9CE] bg-[#FAF8F2]">
          {FAQ_ITEMS.map((item, idx) => (
            <FaqItem
              key={item.code}
              code={item.code}
              q={item.q}
              a={item.a}
              isOpen={openIndex === idx}
              onToggle={() => setOpenIndex((prev) => (prev === idx ? null : idx))}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
