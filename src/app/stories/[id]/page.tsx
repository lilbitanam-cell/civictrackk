import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";
import { getDummyStoryById, DUMMY_CIVIC_STORIES } from "@/data/civic-stories";
import {
  ArrowLeft,
  MapPin,
  Building2,
  Calendar,
  Tag,
  Clock,
  CheckCircle2,
} from "lucide-react";

export function generateStaticParams() {
  return DUMMY_CIVIC_STORIES.map((story) => ({ id: story.id }));
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "—";
    return format(d, "d MMMM yyyy, h:mm a");
  } catch {
    return "—";
  }
}

export default async function CivicStoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const story = getDummyStoryById(id);
  if (!story) notFound();

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5EE] text-[#252820]">
      <LandingNavbar />

      <main className="flex-1 py-10 sm:py-14 px-4 sm:px-6">
        <article className="mx-auto max-w-4xl space-y-8">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/stories"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1B3A2E] hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Civic Stories
            </Link>
            <span className="font-mono text-xs px-2.5 py-1 border border-[#DDD9CE] bg-[#FAF8F2] text-[#1B3A2E]">
              {story.ticketNumber}
            </span>
          </div>

          {/* Story Masthead */}
          <header className="space-y-4 pb-6 border-b border-[#DDD9CE]">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="uppercase tracking-[0.16em] font-semibold text-[#718267]">
                {story.categoryLabel} · Editorial Case Study
              </span>
              <span className="text-[#DDD9CE]">|</span>
              <span className="rounded-sm border border-[#DDD9CE] bg-[#ECE9DF] px-2.5 py-0.5 font-medium text-[#1B3A2E] capitalize">
                {story.status.replace(/_/g, " ")}
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-[#1B3A2E] leading-tight">
              {story.title}
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs text-[#77796F]">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-[#718267] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#252820]">Location</p>
                  <p>
                    {story.location.address}, {story.location.city}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Building2 className="h-4 w-4 text-[#718267] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#252820]">Department</p>
                  <p>{story.departmentName}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-[#718267] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#252820]">Filed On</p>
                  <p>{formatDate(story.createdAt)}</p>
                </div>
              </div>
            </div>
          </header>

          {/* Editorial Illustration Plate */}
          <section className="border border-[#DDD9CE] bg-[#FAF8F2] p-6 flex items-center justify-center">
            {story.artworkStyle === "squircle" ? (
              <div className="h-60 w-60 overflow-hidden rounded-2xl border border-[#1B3A2E]/30 bg-[#FAF2DE]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={story.artworkSrc}
                  alt={story.artworkAlt}
                  className="h-full w-full object-contain scale-[1.08]"
                />
              </div>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={story.artworkSrc}
                alt={story.artworkAlt}
                className="max-h-[340px] w-auto object-contain mix-blend-multiply"
              />
            )}
          </section>

          {/* Narrative Body */}
          <section className="border border-[#DDD9CE] bg-[#FAF8F2] p-6 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#77796F] flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-[#718267]" />
              Field Dispatch Summary
            </p>
            <p className="text-sm sm:text-base text-[#252820] leading-relaxed whitespace-pre-wrap">
              {story.description}
            </p>
          </section>

          {/* Resolution Summary */}
          {story.resolutionNotes && (
            <section className="border border-[#718267] bg-[#FAF8F2] p-6 space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h2 className="font-serif text-xl font-semibold text-[#1B3A2E] flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#2D5A3F]" />
                  Documented Restoration Notes
                </h2>
                {story.resolvedAt && (
                  <span className="text-xs text-[#77796F]">
                    Closed {formatDate(story.resolvedAt)}
                  </span>
                )}
              </div>

              <p className="text-sm text-[#252820] leading-relaxed border-l-2 border-[#1B3A2E] pl-4">
                {story.resolutionNotes}
              </p>
            </section>
          )}

          {/* Resolution Timeline */}
          <section className="border border-[#DDD9CE] bg-[#FAF8F2] p-6 space-y-4">
            <h2 className="font-serif text-xl font-semibold text-[#1B3A2E] flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#718267]" />
              Sample Workflow Timeline
            </h2>
            <div className="relative border-l border-[#DDD9CE] ml-2.5 space-y-5 pt-1">
              {story.timeline.map((item) => (
                <div key={item.id} className="relative pl-5">
                  <div className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-[#1B3A2E] border-2 border-[#FAF8F2]" />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-[#252820] capitalize">
                      {item.action.replace(/_/g, " ")}
                      {item.newStatus
                        ? ` → ${item.newStatus.replace(/_/g, " ")}`
                        : ""}
                    </p>
                    <span className="text-[11px] text-[#77796F]">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#77796F] capitalize mt-0.5">
                    Recorded by {item.actorRole}
                  </p>
                  {item.notes && (
                    <p className="mt-1.5 text-xs text-[#252820] bg-[#F7F5EE] border border-[#DDD9CE] p-2.5">
                      {item.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </article>
      </main>

      <LandingFooter />
    </div>
  );
}
