import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";
import { DUMMY_CIVIC_STORIES, type DummyCivicStory } from "@/data/civic-stories";
import { MapPin, Building2, ArrowRight, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Civic Stories — CivicTrack Public Journal",
  description:
    "Explore illustrated editorial civic stories showing how municipal issues move from resident reports to verified neighbourhood restorations.",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Recently filed";
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "Recently filed";
    return format(d, "d MMM yyyy");
  } catch {
    return "Recently filed";
  }
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  submitted: { label: "Submitted", cls: "bg-[#ECE9DF] text-[#252820] border-[#DDD9CE]" },
  under_review: { label: "Under Review", cls: "bg-[#F3EEDB] text-[#6E552F] border-[#DDD9CE]" },
  assigned: { label: "Assigned", cls: "bg-[#ECE9DF] text-[#1B3A2E] border-[#DDD9CE]" },
  in_progress: { label: "In Progress", cls: "bg-[#718267] text-[#F7F5EE] border-transparent" },
  resolution_submitted: { label: "Awaiting Audit", cls: "bg-[#ECE9DF] text-[#1B3A2E] border-[#718267]" },
  resolved: { label: "Resolved", cls: "bg-[#2D5A3F] text-[#F7F5EE] border-transparent" },
  closed: { label: "Closed", cls: "bg-[#1B3A2E] text-[#F7F5EE] border-transparent" },
};

function CardArtwork({ story }: { story: DummyCivicStory }) {
  if (story.artworkStyle === "squircle") {
    return (
      <div className="aspect-[16/10] w-full border-b border-[#DDD9CE] bg-[#ECE9DF]/70 p-4 flex items-center justify-center">
        <div className="h-full max-h-40 aspect-square overflow-hidden rounded-2xl border border-[#1B3A2E]/30 bg-[#FAF2DE]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={story.artworkSrc}
            alt={story.artworkAlt}
            className="h-full w-full object-contain scale-[1.08] transition-transform duration-300 group-hover:scale-[1.12]"
            loading="lazy"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-[16/10] w-full overflow-hidden border-b border-[#DDD9CE] bg-[#ECE9DF]/55 p-3 flex items-center justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={story.artworkSrc}
        alt={story.artworkAlt}
        className="h-full w-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-[1.03]"
        loading="lazy"
      />
    </div>
  );
}

export default function CivicStoriesPage() {
  const stories = DUMMY_CIVIC_STORIES;

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5EE] text-[#252820]">
      <LandingNavbar />

      <main className="flex-1">
        {/* Editorial Masthead */}
        <section className="relative overflow-hidden border-b border-[#DDD9CE] bg-[#F7F5EE] py-12 sm:py-16 px-4 sm:px-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/images/Hand-Drawn Olive Green Branch.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none hidden lg:block absolute -top-2 right-0 w-[300px] h-auto object-contain mix-blend-multiply opacity-75"
          />
          <div className="relative z-10 mx-auto max-w-6xl space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#718267]">
              The Civic Journal · Editorial Archive
            </p>
            <h1 className="font-serif text-3xl sm:text-5xl font-semibold tracking-tight text-[#1B3A2E] max-w-2xl">
              Civic Stories &amp; Field Dispatches
            </h1>
            <p className="text-sm sm:text-base text-[#77796F] max-w-2xl leading-relaxed">
              Curated editorial dispatches demonstrating how neighbourhood
              maintenance reports travel from resident filing to verified
              municipal closure. Need to check your own report? Use{" "}
              <Link href="/track" className="text-[#1B3A2E] font-medium underline">
                Track a Report
              </Link>
              .
            </p>
          </div>
        </section>

        {/* Stories Grid */}
        <section className="py-12 sm:py-16 px-4 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.map((story) => {
                const st = STATUS_META[story.status] || STATUS_META.submitted;
                const isResolved = story.status === "resolved" || story.status === "closed";

                return (
                  <Link
                    key={story.id}
                    href={`/stories/${story.id}`}
                    className="group flex flex-col justify-between border border-[#DDD9CE] bg-[#FAF8F2] hover:border-[#718267] transition-colors"
                  >
                    <div>
                      <CardArtwork story={story} />

                      <div className="p-5 space-y-3">
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span className={`rounded-sm border px-2 py-0.5 font-medium ${st.cls}`}>
                            {st.label}
                          </span>
                          <span className="text-[#77796F]">
                            {formatDate(story.createdAt)}
                          </span>
                        </div>

                        <h2 className="font-serif text-xl font-semibold leading-snug text-[#252820] group-hover:text-[#1B3A2E] line-clamp-2">
                          {story.title}
                        </h2>

                        <p className="text-xs text-[#77796F] leading-relaxed line-clamp-3">
                          {story.resolutionNotes || story.description}
                        </p>
                      </div>
                    </div>

                    <div className="px-5 py-3.5 border-t border-[#DDD9CE] flex items-center justify-between gap-2 text-[11px] text-[#77796F]">
                      <div className="min-w-0 space-y-0.5">
                        <p className="flex items-center gap-1 truncate text-[#252820]">
                          <MapPin className="h-3 w-3 shrink-0 text-[#718267]" />
                          <span className="truncate">{story.location.address}</span>
                        </p>
                        <p className="flex items-center gap-1 truncate">
                          <Building2 className="h-3 w-3 shrink-0 text-[#718267]" />
                          <span className="truncate">{story.departmentName}</span>
                        </p>
                      </div>
                      {isResolved ? (
                        <span className="shrink-0 inline-flex items-center gap-1 text-[#2D5A3F] font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Verified
                        </span>
                      ) : (
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#1B3A2E]" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
