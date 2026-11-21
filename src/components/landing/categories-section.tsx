import Link from "next/link";
import {
  Construction,
  Trash2,
  Droplets,
  Waves,
  Lightbulb,
  Building2,
  Sparkles,
  MoreHorizontal,
} from "lucide-react";

const CATEGORIES = [
  {
    icon: Construction,
    label: "Roads & Potholes",
    description: "Damaged roads, potholes, broken dividers",
    href: "/register",
  },
  {
    icon: Trash2,
    label: "Garbage Collection",
    description: "Uncollected waste, overflowing bins",
    href: "/register",
  },
  {
    icon: Droplets,
    label: "Water Leakage",
    description: "Burst pipes, water seepage, supply issues",
    href: "/register",
  },
  {
    icon: Waves,
    label: "Drainage",
    description: "Blocked drains, waterlogging, flooding",
    href: "/register",
  },
  {
    icon: Lightbulb,
    label: "Streetlights",
    description: "Broken lights, non-functional poles",
    href: "/register",
  },
  {
    icon: Building2,
    label: "Public Infrastructure",
    description: "Damaged footpaths, public property",
    href: "/register",
  },
  {
    icon: Sparkles,
    label: "Sanitation",
    description: "Public toilet upkeep, open defecation areas",
    href: "/register",
  },
  {
    icon: MoreHorizontal,
    label: "Other Issues",
    description: "Encroachments, noise, misc civic concerns",
    href: "/register",
  },
];

export function CategoriesSection() {
  return (
    <section id="categories" className="bg-[#F8F9F5] py-14 px-4 sm:px-6">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-10 max-w-xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#788568]">
            Issue Categories
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-[#30352D]">
            What can you report?
          </h2>
          <p className="mt-2.5 text-sm text-[#74796F] leading-relaxed">
            CivicTrack routes your complaint to the right department automatically.
            Select the category that best describes the problem.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.label}
                href={cat.href}
                className="group flex flex-col gap-3 rounded-md border border-[#E5E8DF] bg-white p-4 hover:border-[#B4BBA5] hover:bg-[#FAFAF8] transition-colors"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#F1F3EC] text-[#536247] group-hover:bg-[#E9EDE4] transition-colors">
                  <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#30352D] leading-tight">
                    {cat.label}
                  </p>
                  <p className="mt-1 text-xs text-[#74796F] leading-snug">
                    {cat.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        <p className="mt-6 text-xs text-[#74796F]">
          Not sure which category fits?{" "}
          <Link href="/register" className="font-semibold text-[#536247] hover:underline">
            Select &quot;Other Issues&quot;
          </Link>{" "}
          and our team will route it correctly.
        </p>
      </div>
    </section>
  );
}
