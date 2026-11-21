import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  return (
    <section className="border-t border-[#E5E8DF] bg-[#3E4B37] py-14 px-4 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

          {/* Text */}
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Your neighbourhood. Your report.
            </h2>
            <p className="mt-3 text-sm text-[#B4BBA5] leading-relaxed max-w-md">
              Every unlit street, every blocked drain, every broken road — it starts with someone
              taking a minute to report it. Be that person for your community.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-md bg-[#788568] px-6 py-3 text-sm font-semibold text-white hover:bg-[#536247] transition-colors"
            >
              Report an Issue
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-md border border-[#536247] bg-transparent px-6 py-3 text-sm font-semibold text-white hover:bg-[#536247] transition-colors"
            >
              Sign In to Your Account
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
