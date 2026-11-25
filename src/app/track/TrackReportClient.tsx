"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  MapPin,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import type { PublicCivicStory } from "@/services/server/complaints.server";

interface TimelineEntry {
  id: string;
  action: string;
  actorRole: string;
  previousStatus?: string;
  newStatus?: string;
  notes?: string;
  createdAt: string | null;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "—";
    return format(d, "d MMM yyyy, h:mm a");
  } catch {
    return "—";
  }
}

export default function TrackReportClient({
  initialTicket = "",
}: {
  initialTicket?: string;
}) {
  const [ticket, setTicket] = useState(initialTicket);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<PublicCivicStory | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);

  const lookupTicket = useCallback(async (refNumber: string) => {
    const clean = refNumber.trim().toUpperCase();
    if (!clean) {
      setError("Please enter your complaint reference number.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/complaints/track?ticket=${encodeURIComponent(clean)}`
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setReport(null);
        setTimeline([]);
        setError(data.error || "Unable to find a report with that reference.");
        return;
      }
      setReport(data.report);
      setTimeline(data.timeline || []);
    } catch {
      setError("Unable to reach tracking service. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialTicket.trim()) {
      lookupTicket(initialTicket);
    }
  }, [initialTicket, lookupTicket]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    lookupTicket(ticket);
  };

  return (
    <div className="space-y-8">
      {/* Lookup Form */}
      <form
        onSubmit={handleSubmit}
        className="border border-[#DDD9CE] bg-[#FAF8F2] p-5 sm:p-6 space-y-4"
      >
        <label
          htmlFor="ticket-input"
          className="block text-xs font-semibold uppercase tracking-[0.16em] text-[#1B3A2E]"
        >
          Complaint Reference Number
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#77796F]" />
            <Input
              id="ticket-input"
              placeholder="e.g. CT-202611-4821"
              value={ticket}
              onChange={(e) => setTicket(e.target.value)}
              className="pl-9 font-mono uppercase"
              disabled={loading}
            />
          </div>
          <Button type="submit" disabled={loading} className="sm:px-6">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              "Track Status"
            )}
          </Button>
        </div>
        <p className="text-xs text-[#77796F]">
          Your reference number appears on your dashboard confirmation and email
          alerts (format: <span className="font-mono">CT-YYYYMM-XXXX</span>).
        </p>
      </form>

      {error && (
        <div className="border border-[#E4C9C6] bg-[#F4E8E7] p-4 text-xs sm:text-sm text-[#8B342E] flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Report Result */}
      {report && (
        <div className="space-y-6">
          <div className="border border-[#DDD9CE] bg-[#FAF8F2] p-6 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[#DDD9CE]">
              <div className="space-y-1">
                <span className="font-mono text-xs font-semibold text-[#1B3A2E] bg-[#ECE9DF] px-2 py-0.5 border border-[#DDD9CE]">
                  {report.ticketNumber}
                </span>
                <h2 className="font-serif text-2xl font-semibold text-[#252820] pt-1">
                  {report.title}
                </h2>
              </div>
              <span className="rounded-sm bg-[#1B3A2E] text-[#F7F5EE] px-3 py-1 text-xs font-medium capitalize">
                {report.status.replace(/_/g, " ")}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-[#718267] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#252820]">Location</p>
                  <p className="text-[#77796F]">
                    {report.location?.address || "Municipal Ward"}
                    {report.location?.city ? `, ${report.location.city}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Building2 className="h-4 w-4 text-[#718267] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#252820]">Assigned Department</p>
                  <p className="text-[#77796F]">
                    {report.departmentName || "Awaiting Departmental Assignment"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-[#718267] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#252820]">Submission Date</p>
                  <p className="text-[#77796F]">{formatDate(report.createdAt)}</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#DDD9CE] space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#77796F]">
                Issue Details
              </p>
              <p className="text-sm text-[#252820] leading-relaxed whitespace-pre-wrap">
                {report.description}
              </p>
            </div>

            {report.adminRemarks && (
              <div className="border-l-2 border-[#1B3A2E] bg-[#F7F5EE] p-3 text-xs text-[#252820]">
                <span className="font-semibold text-[#1B3A2E] block mb-0.5">
                  Municipal Update
                </span>
                {report.adminRemarks}
              </div>
            )}

            {report.rejectionReason && (
              <div className="border-l-2 border-[#8B342E] bg-[#F4E8E7] p-3 text-xs text-[#8B342E]">
                <span className="font-semibold block mb-0.5">Rejection Notice</span>
                {report.rejectionReason}
              </div>
            )}
          </div>

          {/* Resolution Evidence */}
          {(report.resolutionImages.length > 0 || report.resolutionNotes) && (
            <div className="border border-[#718267] bg-[#FAF8F2] p-6 space-y-4">
              <h3 className="font-serif text-xl font-semibold text-[#1B3A2E] flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[#2D5A3F]" />
                Resolution Evidence
              </h3>
              {report.resolutionNotes && (
                <p className="text-sm text-[#252820] leading-relaxed">
                  {report.resolutionNotes}
                </p>
              )}
              {report.resolutionImages.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {report.resolutionImages.map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="block overflow-hidden border border-[#DDD9CE]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Resolution evidence ${idx + 1}`}
                        className="w-full h-56 object-cover"
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Progress Timeline */}
          <div className="border border-[#DDD9CE] bg-[#FAF8F2] p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-serif text-xl font-semibold text-[#1B3A2E] flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#718267]" />
                Progress Timeline
              </h3>
              <Link
                href={`/stories/${report.id}`}
                className="text-xs font-medium text-[#1B3A2E] hover:underline inline-flex items-center gap-1"
              >
                Open full story view <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {timeline.length === 0 ? (
              <p className="text-xs text-[#77796F]">
                Initial filing recorded. Municipal updates will appear here.
              </p>
            ) : (
              <div className="relative border-l border-[#DDD9CE] ml-2.5 space-y-4 pt-1">
                {timeline.map((item) => (
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
                    {item.notes && (
                      <p className="mt-1 text-xs text-[#77796F]">{item.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
