import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, MapPin, CheckCircle2, Clock, Building2 } from "lucide-react";
import { DUMMY_CIVIC_STORIES, type DummyCivicStory } from "@/data/civic-stories";

function formatStoryDate(dateStr: string | null): string {
  if (!dateStr) return "Recently logged";
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "Recently logged";
    return format(d, "d MMM yyyy");
  } catch {
    return "Recently logged";
  }
}

const STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  submitted: { label: "Submitted", tone: "bg-[#ECE9DF] text-[#252820] border-[#DDD9CE]" },
  under_review: { label: "Under Review", tone: "bg-[#F3EEDB] text-[#6E552F] border-[#DDD9CE]" },
  assigned: { label: "Assigned", tone: "bg-[#ECE9DF] text-[#1B3A2E] border-[#DDD9CE]" },
  in_progress: { label: "In Progress", tone: "bg-[#718267] text-[#F7F5EE] border-transparent" },
  resolution_submitted: { label: "Awaiting Audit", tone: "bg-[#ECE9DF] text-[#1B3A2E] border-[#718267]" },
  resolved: { label: "Resolved", tone: "bg-[#1B3A2E] text-[#F7F5EE] border-transparent" },
  closed: { label: "Closed", tone: "bg-[#263D30] text-[#F7F5EE] border-transparent" },
};

function StoryArtwork({
  story,
  aspectClass = "aspect-[16/10]",
}: {
  story: DummyCivicStory;
  aspectClass?: string;
}) {
  if (story.artworkStyle === "squircle") {
    return (
      <div
        className={`${aspectClass} w-full border border-[#DDD9CE] bg-[#ECE9DF]/70 p-4 flex items-center justify-center`}
      >
        <div className="h-full max-h-44 aspect-square overflow-hidden rounded-2xl border border-[#1B3A2E]/30 bg-[#FAF2DE]">
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
    <div
      className={`${aspectClass} w-full overflow-hidden border border-[#DDD9CE] bg-[#ECE9DF]/60 p-3 flex items-center justify-center`}
    >
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

export function CivicStoriesSection() {
  const leadStory = DUMMY_CIVIC_STORIES[0];
  const secondaryStories = DUMMY_CIVIC_STORIES.slice(1, 3);
  const recentReported = DUMMY_CIVIC_STORIES.slice(2, 6);
  const recentResolved = DUMMY_CIVIC_STORIES.filter(
    (s) => s.status === "resolved" || s.status === "closed"
  ).slice(0, 4);

  return (
    <section
      id="stories"
      className="bg-[#FAF8F2] py-16 sm:py-20 px-4 sm:px-6 border-b border-[#DDD9CE]"
    >
      <div className="mx-auto max-w-6xl space-y-14">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#DDD9CE]">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#718267]">
              Civic Stories · Editorial Dispatches
            </p>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-[#1B3A2E]">
              From citizen report to public record
            </h2>
            <p className="mt-2.5 text-sm text-[#77796F] leading-relaxed">
              Sample municipal field stories illustrating how neighbourhood
              reports move through departmental review to verified restoration.
            </p>
          </div>
          <Link
            href="/stories"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1B3A2E] hover:underline shrink-0"
          >
            <span>Browse all Civic Stories</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Featured Editorial Spread */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Lead Story (7 columns) */}
          {leadStory && (
            <Link
              href={`/stories/${leadStory.id}`}
              className="group lg:col-span-7 flex flex-col justify-between space-y-4 lg:pr-6 lg:border-r border-[#DDD9CE]"
            >
              <div className="space-y-4">
                <StoryArtwork story={leadStory} aspectClass="aspect-[16/10]" />
                <div className="flex flex-wrap items-center gap-2.5 text-[11px]">
                  <span
                    className={`rounded-sm border px-2 py-0.5 font-medium ${
                      (STATUS_LABELS[leadStory.status] || STATUS_LABELS.submitted).tone
                    }`}
                  >
                    {(STATUS_LABELS[leadStory.status] || STATUS_LABELS.submitted).label}
                  </span>
                  <span className="font-mono text-[#77796F]">
                    {leadStory.ticketNumber}
                  </span>
                  <span className="text-[#77796F]">·</span>
                  <span className="text-[#718267] font-medium capitalize">
                    {leadStory.categoryLabel}
                  </span>
                </div>

                <h3 className="font-serif text-2xl sm:text-3xl font-semibold leading-snug text-[#252820] group-hover:text-[#1B3A2E] transition-colors">
                  {leadStory.title}
                </h3>

                <p className="text-sm text-[#77796F] leading-relaxed line-clamp-3">
                  {leadStory.resolutionNotes || leadStory.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#DDD9CE] flex flex-wrap items-center justify-between gap-2 text-xs text-[#77796F]">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-[#718267]" />
                    {leadStory.location.address}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-[#718267]" />
                    {leadStory.departmentName}
                  </span>
                </div>
                <span className="font-medium text-[#1B3A2E] inline-flex items-center gap-1">
                  Read dispatch <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          )}

          {/* Secondary Stories (5 columns) */}
          <div className="lg:col-span-5 flex flex-col divide-y divide-[#DDD9CE]">
            {secondaryStories.map((story) => {
              const st = STATUS_LABELS[story.status] || STATUS_LABELS.submitted;
              return (
                <Link
                  key={story.id}
                  href={`/stories/${story.id}`}
                  className="group py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row lg:flex-row gap-4"
                >
                  <div className="sm:w-36 lg:w-32 shrink-0">
                    <StoryArtwork story={story} aspectClass="aspect-square" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className={`rounded-sm border px-1.5 py-0.5 font-medium ${st.tone}`}>
                        {st.label}
                      </span>
                      <span className="text-[#77796F]">
                        {formatStoryDate(story.createdAt)}
                      </span>
                    </div>
                    <h4 className="font-serif text-lg font-semibold leading-snug text-[#252820] group-hover:text-[#1B3A2E] line-clamp-2">
                      {story.title}
                    </h4>
                    <p className="text-xs text-[#77796F] line-clamp-2 leading-relaxed">
                      {story.resolutionNotes || story.description}
                    </p>
                    <p className="text-[11px] text-[#718267] flex items-center gap-1 pt-0.5 truncate">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{story.location.address}</span>
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Two Ledger Columns: Featured Dispatches & Recently Resolved */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-[#DDD9CE]">
          {/* Dispatches */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-semibold text-[#1B3A2E] flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#718267]" />
                Neighbourhood Dispatches
              </h3>
              <Link href="/stories" className="text-xs text-[#718267] hover:text-[#1B3A2E]">
                All stories →
              </Link>
            </div>
            <div className="divide-y divide-[#DDD9CE] border-t border-b border-[#DDD9CE] bg-[#F7F5EE]">
              {recentReported.map((item) => {
                const st = STATUS_LABELS[item.status] || STATUS_LABELS.submitted;
                return (
                  <Link
                    key={item.id}
                    href={`/stories/${item.id}`}
                    className="flex items-start justify-between gap-3 p-3.5 hover:bg-[#ECE9DF]/60 transition-colors"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 text-[11px] text-[#77796F]">
                        <span className="font-mono text-[#1B3A2E] font-medium">
                          {item.ticketNumber}
                        </span>
                        <span>·</span>
                        <span>{formatStoryDate(item.createdAt)}</span>
                      </div>
                      <p className="text-sm font-medium text-[#252820] truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-[#77796F] truncate">
                        {item.location.address}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-sm border px-2 py-0.5 text-[10px] font-medium ${st.tone}`}>
                      {st.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Completed Case Studies */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-semibold text-[#1B3A2E] flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#2D5A3F]" />
                Completed Civic Restorations
              </h3>
              <Link href="/track" className="text-xs text-[#718267] hover:text-[#1B3A2E]">
                Track your ticket →
              </Link>
            </div>
            <div className="divide-y divide-[#DDD9CE] border-t border-b border-[#DDD9CE] bg-[#F7F5EE]">
              {recentResolved.map((item) => (
                <Link
                  key={item.id}
                  href={`/stories/${item.id}`}
                  className="flex items-start justify-between gap-3 p-3.5 hover:bg-[#ECE9DF]/60 transition-colors"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 text-[11px] text-[#77796F]">
                      <span className="font-mono text-[#1B3A2E] font-medium">
                        {item.ticketNumber}
                      </span>
                      <span>·</span>
                      <span>{item.departmentName}</span>
                    </div>
                    <p className="text-sm font-medium text-[#252820] truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-[#77796F] truncate">
                      {item.resolutionNotes || item.location.address}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-sm bg-[#2D5A3F] text-[#F7F5EE] px-2 py-0.5 text-[10px] font-medium">
                    Resolved
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
