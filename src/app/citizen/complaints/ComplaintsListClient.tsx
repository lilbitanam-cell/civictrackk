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
    badgeClass: "bg-[#F1F3EC] text-[#536247] border-[#D8DDD1]",
    dotClass: "bg-[#788568]",
  },
  under_review: {
    label: "Under Review",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    dotClass: "bg-amber-500",
  },
  assigned: {
    label: "Assigned",
    badgeClass: "bg-[#E9EDE4] text-[#3E4B37] border-[#B4BBA5]",
    dotClass: "bg-[#536247]",
  },
  in_progress: {
    label: "In Progress",
    badgeClass: "bg-[#788568] text-white border-transparent",
    dotClass: "bg-white",
  },
  resolution_submitted: {
    label: "Resolution Submitted",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
    dotClass: "bg-blue-500",
  },
  resolved: {
    label: "Resolved",
    badgeClass: "bg-[#3E4B37] text-white border-transparent",
    dotClass: "bg-emerald-300",
  },
  closed: {
    label: "Closed",
    badgeClass: "bg-[#30352D] text-white border-transparent",
    dotClass: "bg-neutral-400",
  },
  rejected: {
    label: "Rejected",
    badgeClass: "bg-red-50 text-red-700 border-red-200",
    dotClass: "bg-red-500",
  },
};

const PRIORITY_BADGES: Record<string, string> = {
  low: "bg-[#F8F9F5] text-[#74796F] border-[#E5E8DF]",
  medium: "bg-amber-50 text-amber-800 border-amber-200",
  high: "bg-orange-50 text-orange-800 border-orange-200",
  urgent: "bg-red-50 text-red-700 border-red-200 font-semibold",
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
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
      (c.location?.address &&
        c.location.address.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = status === "all" || c.status === status;
    return matchSearch && matchStatus;
  });

  const isFiltered = search.trim().length > 0 || status !== "all";

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="bg-white p-3.5 rounded-lg border border-[#E5E8DF] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-1 w-full sm:w-auto items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#74796F]" />
            <Input
              placeholder="Filter by ticket number, title, or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 border-[#E5E8DF] bg-white text-sm focus-visible:ring-[#788568]"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-44 border-[#E5E8DF] bg-white text-sm focus:ring-[#788568]">
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
          <span className="text-xs text-[#74796F]">
            Showing <strong className="text-[#30352D]">{filtered.length}</strong> of {complaints.length}
          </span>
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setStatus("all");
              }}
              className="text-xs text-[#536247] hover:text-[#30352D] h-8 px-2 flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* Grid of complaints */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-[#E5E8DF] p-6 space-y-2">
          <p className="text-sm font-semibold text-[#30352D]">No matching grievances found</p>
          <p className="text-xs text-[#74796F]">
            Try adjusting your search keywords or changing the status filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((c) => {
            const dateStr = c.createdAt
              ? typeof c.createdAt === "string"
                ? c.createdAt
                : "toDate" in c.createdAt
                ? c.createdAt.toDate().toISOString()
                : String(c.createdAt)
              : null;

            const st = STATUS_CONFIG[c.status] || {
              label: c.status.replace(/_/g, " "),
              badgeClass: "bg-gray-100 text-gray-800 border-gray-200",
              dotClass: "bg-gray-400",
            };

            return (
              <Link
                key={c.id}
                href={`/citizen/complaints/${c.id}`}
                className="block group"
              >
                <Card className="h-full border-[#E5E8DF] hover:border-[#788568] hover:shadow-xs transition-all bg-white">
                  <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
                    <div>
                      {/* Ticket header strip */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] font-mono font-medium text-[#536247] bg-[#F1F3EC] px-2 py-0.5 rounded border border-[#E5E8DF]">
                          {c.ticketNumber}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded border capitalize ${
                              PRIORITY_BADGES[c.priority] || "bg-gray-100"
                            }`}
                          >
                            {c.priority}
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
                      <h3 className="font-semibold text-sm text-[#30352D] group-hover:text-[#536247] transition-colors line-clamp-1">
                        {c.title}
                      </h3>
                      <p className="text-xs text-[#74796F] line-clamp-2 mt-1 leading-relaxed">
                        {c.description}
                      </p>
                    </div>

                    {/* Meta strip */}
                    <div className="space-y-1.5 pt-2.5 border-t border-[#F1F3EC] text-xs text-[#74796F]">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 truncate">
                          <Tag className="h-3.5 w-3.5 shrink-0 text-[#788568]" />
                          <span className="capitalize text-[#30352D] font-medium">
                            {c.categoryLabel || c.category.replace(/_/g, " ")}
                          </span>
                        </span>
                        {dateStr && (
                          <span className="flex items-center gap-1 shrink-0 text-[11px]">
                            <Clock className="h-3 w-3 text-[#74796F]" />
                            {formatDistanceToNow(new Date(dateStr), {
                              addSuffix: true,
                            })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-0.5">
                        {c.location?.address ? (
                          <span className="flex items-center gap-1.5 truncate text-[11px]">
                            <MapPin className="h-3 w-3 shrink-0 text-[#788568]" />
                            <span className="truncate">{c.location.address}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#74796F]">—</span>
                        )}
                        <span className="text-[11px] text-[#536247] font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
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
