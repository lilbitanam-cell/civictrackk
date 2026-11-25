import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";

export function CtaSection() {
  return (
    <section className="bg-[#1B3A2E] py-16 px-4 sm:px-6 text-[#F7F5EE]">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#B8C4AE]">
              File a Municipal Dispatch
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-[#F7F5EE]">
              Your neighbourhood. Your record.
            </h2>
            <p className="text-sm text-[#D5DDD0] leading-relaxed max-w-lg">
              Every unlit lane, blocked drain, or damaged pavement begins with a
              clear, documented report. Log an issue in under two minutes.
            </p>
          </div>

          <div className="md:col-span-5 flex flex-wrap md:justify-end gap-3">
            <Link
              href="/citizen/report"
              className="inline-flex items-center gap-2 rounded-sm bg-[#F7F5EE] px-5 py-3 text-sm font-semibold text-[#1B3A2E] hover:bg-[#ECE9DF] transition-colors"
            >
              <span>Report an Issue</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/track"
              className="inline-flex items-center gap-2 rounded-sm border border-[#718267] bg-[#263D30] px-5 py-3 text-sm font-medium text-[#F7F5EE] hover:bg-[#314E3E] transition-colors"
            >
              <Search className="h-4 w-4" />
              <span>Track a Report</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
