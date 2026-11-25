"use client";

import { useState } from "react";
import Link from "next/link";
import { ComplaintDocument } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { MapPin, Clock, Tag, Search, X, ChevronRight } from "lucide-react";

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; dotClass: string }
> = {
  submitted: {
    label: "Submitted",
    badgeClass: "bg-[#ECE9DF] text-[#263D30] border-[#DDD9CE]",
    dotClass: "bg-[#718267]",
  },
  under_review: {
    label: "Under Review",
    badgeClass: "bg-amber-50/80 text-amber-900 border-amber-200/80",
    dotClass: "bg-amber-600",
  },
  assigned: {
    label: "Assigned",
    badgeClass: "bg-[#ECE9DF] text-[#1B3A2E] border-[#B4BBA5]",
    dotClass: "bg-[#1B3A2E]",
  },
  in_progress: {
    label: "In Progress",
    badgeClass: "bg-[#718267] text-white border-transparent",
    dotClass: "bg-white",
  },
  resolution_submitted: {
    label: "Resolution Submitted",
    badgeClass: "bg-sky-50/80 text-sky-900 border-sky-200",
    dotClass: "bg-sky-600",
  },
  resolved: {
    label: "Resolved",
    badgeClass: "bg-[#1B3A2E] text-[#F7F5EE] border-transparent",
    dotClass: "bg-emerald-300",
  },
  closed: {
    label: "Closed",
    badgeClass: "bg-[#252820] text-[#F7F5EE] border-transparent",
    dotClass: "bg-[#DDD9CE]",
  },
  rejected: {
    label: "Rejected",
    badgeClass: "bg-[#FAF0EE] text-[#8B342E] border-[#E5C9C6]",
    dotClass: "bg-[#8B342E]",
  },
};

const PRIORITY_BADGES: Record<string, string> = {
  low: "bg-[#F7F5EE] text-[#77796F] border-[#DDD9CE]",
  medium: "bg-amber-50/80 text-amber-900 border-amber-200/80",
  high: "bg-orange-50/80 text-orange-900 border-orange-200/80",
  urgent: "bg-[#FAF0EE] text-[#8B342E] border-[#E5C9C6] font-semibold",
};

export default function ComplaintsListClient({
  complaints,
}: {
  complaints: ComplaintDocument[];
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = complaints.filter((c) => {
    const matchSearch =
      !search ||
      (c.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.ticketNumber || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.location?.address &&
        c.location.address.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = status === "all" || c.status === status;
    return matchSearch && matchStatus;
  });

  const isFiltered = search.trim().length > 0 || status !== "all";

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="bg-[#FAF8F2] p-3.5 rounded-sm border border-[#DDD9CE] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-1 w-full sm:w-auto items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#77796F]" />
            <Input
              placeholder="Filter by ticket number, title, or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 border-[#DDD9CE] bg-[#F7F5EE] text-sm focus-visible:ring-[#1B3A2E]"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-44 border-[#DDD9CE] bg-[#F7F5EE] text-sm focus:ring-[#1B3A2E]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolution_submitted">Resolution Submitted</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-xs text-[#77796F]">
            Showing <strong className="text-[#252820]">{filtered.length}</strong> of {complaints.length}
          </span>
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setStatus("all");
              }}
              className="text-xs text-[#1B3A2E] hover:text-[#252820] h-8 px-2 flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* Grid of complaints */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-[#FAF8F2] rounded-sm border border-[#DDD9CE] p-6 space-y-2">
          <p className="font-serif text-base font-medium text-[#252820]">No matching grievances found</p>
          <p className="text-xs text-[#77796F]">
            Try adjusting your search keywords or changing the status filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((c) => {
            let formattedTime = "recently";
            try {
              if (c.createdAt) {
                const raw = c.createdAt as any;
                const d =
                  typeof raw === "string"
                    ? new Date(raw)
                    : typeof raw?.toDate === "function"
                    ? raw.toDate()
                    : typeof raw?.seconds === "number"
                    ? new Date(raw.seconds * 1000)
                    : typeof raw?._seconds === "number"
                    ? new Date(raw._seconds * 1000)
                    : new Date(raw);
                if (!Number.isNaN(d.getTime())) {
                  formattedTime = formatDistanceToNow(d, { addSuffix: true });
                }
              }
            } catch {
              formattedTime = "recently";
            }

            const st = STATUS_CONFIG[c.status] || {
              label: (c.status || "submitted").replace(/_/g, " "),
              badgeClass: "bg-gray-100 text-gray-800 border-gray-200",
              dotClass: "bg-gray-400",
            };

            return (
              <Link
                key={c.id}
                href={`/citizen/complaints/${c.id}`}
                className="block group"
              >
                <Card className="h-full border-[#DDD9CE] hover:border-[#718267] hover:shadow-xs transition-all bg-[#FAF8F2]">
                  <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
                    <div>
                      {/* Ticket header strip */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] font-mono font-medium text-[#1B3A2E] bg-[#ECE9DF] px-2 py-0.5 rounded-sm border border-[#DDD9CE]">
                          {c.ticketNumber || `#${c.id.slice(0, 8)}`}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded border capitalize ${
                              PRIORITY_BADGES[c.priority] || "bg-gray-100"
                            }`}
                          >
                            {c.priority || "medium"}
                          </span>
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded border font-medium flex items-center gap-1.5 ${st.badgeClass}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${st.dotClass}`} />
                            {st.label}
                          </span>
                        </div>
                      </div>

                      {/* Title and Description */}
                      <h3 className="font-serif font-medium text-base text-[#252820] group-hover:text-[#1B3A2E] transition-colors line-clamp-1">
                        {c.title}
                      </h3>
                      <p className="text-xs text-[#77796F] line-clamp-2 mt-1 leading-relaxed">
                        {c.description}
                      </p>
                    </div>

                    {/* Meta strip */}
                    <div className="space-y-1.5 pt-2.5 border-t border-[#DDD9CE]/70 text-xs text-[#77796F]">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 truncate">
                          <Tag className="h-3.5 w-3.5 shrink-0 text-[#718267]" />
                          <span className="capitalize text-[#252820] font-medium">
                            {c.categoryLabel || (c.category ? c.category.replace(/_/g, " ") : "Civic Issue")}
                          </span>
                        </span>
                        <span className="flex items-center gap-1 shrink-0 text-[11px]">
                          <Clock className="h-3 w-3 text-[#77796F]" />
                          {formattedTime}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-0.5">
                        {c.location?.address ? (
                          <span className="flex items-center gap-1.5 truncate text-[11px]">
                            <MapPin className="h-3 w-3 shrink-0 text-[#718267]" />
                            <span className="truncate">{c.location.address}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#77796F]">—</span>
                        )}
                        <span className="text-[11px] text-[#1B3A2E] font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                          Details <ChevronRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
