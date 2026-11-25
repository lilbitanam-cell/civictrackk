import Link from "next/link";
import { ShieldCheck, ArrowUpRight } from "lucide-react";

const CATEGORIES: Array<{
  code: string;
  label: string;
  description: string;
  href: string;
  imageSrc?: string;
  imageStyle?: "cutout" | "squircle" | "scene";
}> = [
  {
    code: "01",
    label: "Roads & Potholes",
    description:
      "Damaged carriageways, potholes, sunken manholes, and broken road dividers.",
    href: "/citizen/report?category=roads_potholes",
    imageSrc: "/assets/icons/Watercolor Road Repair Crew.png",
    imageStyle: "cutout",
  },
  {
    code: "02",
    label: "Water Supply",
    description:
      "Pipeline leakages, burst mains, contaminated supply, and low ward pressure.",
    href: "/citizen/report?category=water_leakage",
    imageSrc: "/assets/icons/Water Tap with Basin and Greenery.png",
    imageStyle: "squircle",
  },
  {
    code: "03",
    label: "Sanitation",
    description:
      "Uncollected household waste, overflowing bins, and public convenience upkeep.",
    href: "/citizen/report?category=sanitation",
    imageSrc: "/assets/icons/Watercolor Dual Waste Bins.png",
    imageStyle: "squircle",
  },
  {
    code: "04",
    label: "Drainage",
    description:
      "Clogged stormwater drains, monsoon waterlogging, and open sewer overflows.",
    href: "/citizen/report?category=drainage",
    imageSrc: "/assets/icons/Watercolor Storm Drain with Lush Greenery.png",
    imageStyle: "cutout",
  },
  {
    code: "05",
    label: "Streetlights",
    description:
      "Dark intersections, flickering lamps, and damaged electrical feeder poles.",
    href: "/citizen/report?category=streetlights",
    imageSrc: "/assets/icons/Vintage Streetlamp Among Greenery.png",
    imageStyle: "squircle",
  },
  {
    code: "06",
    label: "Public Infrastructure",
    description:
      "Cracked footpaths, municipal park benches, bus shelters, and civic buildings.",
    href: "/citizen/report?category=public_infrastructure",
    imageSrc: "/assets/images/Civic Cityscape with Domed Landmark.png",
    imageStyle: "scene",
  },
  {
    code: "07",
    label: "Public Safety",
    description:
      "Exposed wiring, fallen trees, broken railings, and hazardous civic obstructions.",
    href: "/citizen/report?category=other",
  },
];

export function CategoriesSection() {
  return (
    <section
      id="categories"
      className="relative overflow-hidden bg-[#F7F5EE] py-16 sm:py-20 px-4 sm:px-6 border-b border-[#DDD9CE]"
    >
      {/* Subtle botanical tree canopy along upper-right section transition */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/images/Vintage Watercolor Greenery Branch.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none select-none hidden lg:block absolute -top-2 right-0 w-[340px] xl:w-[400px] h-auto object-contain mix-blend-multiply opacity-85"
      />

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Editorial Section Header */}
        <div className="mb-12 max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#718267]">
            Departmental Index · Issue Categories
          </p>
          <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-[#1B3A2E]">
            What neighbourhoods can document
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#77796F] leading-relaxed">
            Each report is classified and routed directly to the responsible
            municipal engineering, sanitation, or electrical division.
          </p>
        </div>

        {/* Editorial ruled grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-l border-[#DDD9CE]">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.label}
              href={cat.href}
              className="group flex flex-col justify-between gap-5 border-r border-b border-[#DDD9CE] bg-[#FAF8F2] p-6 hover:bg-[#ECE9DF]/70 transition-colors"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  {cat.imageSrc ? (
                    cat.imageStyle === "squircle" ? (
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[#1B3A2E]/30 bg-[#FAF2DE]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={cat.imageSrc}
                          alt={cat.label}
                          className="h-full w-full object-contain scale-[1.12] transition-transform duration-300 group-hover:scale-[1.16]"
                          loading="lazy"
                        />
                      </div>
                    ) : cat.imageStyle === "scene" ? (
                      <div className="h-14 w-24 shrink-0 overflow-hidden rounded-sm border border-[#DDD9CE] bg-[#F7F5EE] px-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={cat.imageSrc}
                          alt={cat.label}
                          className="h-full w-full object-contain mix-blend-multiply"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="h-14 w-16 shrink-0 flex items-center justify-start">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={cat.imageSrc}
                          alt={cat.label}
                          className="h-14 w-auto object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    )
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-sm border border-[#DDD9CE] bg-[#F7F5EE] text-[#1B3A2E] group-hover:bg-[#1B3A2E] group-hover:text-[#F7F5EE] transition-colors">
                      <ShieldCheck className="h-6 w-6" strokeWidth={1.6} />
                    </div>
                  )}
                  <span className="font-mono text-[11px] text-[#77796F]">
                    {cat.code}
                  </span>
                </div>

                <div>
                  <h3 className="font-serif text-lg font-semibold text-[#252820] group-hover:text-[#1B3A2E] transition-colors">
                    {cat.label}
                  </h3>
                  <p className="mt-1.5 text-xs text-[#77796F] leading-relaxed">
                    {cat.description}
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 text-xs font-medium text-[#1B3A2E] pt-1">
                File in category
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </Link>
          ))}

          {/* 8th editorial cell: direct filing callout */}
          <Link
            href="/citizen/report"
            className="group flex flex-col justify-between gap-5 border-r border-b border-[#DDD9CE] bg-[#1B3A2E] p-6 text-[#F7F5EE] hover:bg-[#263D30] transition-colors"
          >
            <div className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.18em] text-[#B8C4AE]">
                Direct Dispatch
              </span>
              <h3 className="font-serif text-xl font-semibold leading-snug">
                See another municipal concern?
              </h3>
              <p className="text-xs text-[#D5DDD0] leading-relaxed">
                File under general civic matters and municipal triage will assign
                the appropriate field team.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F7F5EE]">
              Open Grievance Form
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
