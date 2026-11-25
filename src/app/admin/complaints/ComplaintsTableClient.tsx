"use client";

import { useState } from "react";
import Link from "next/link";
import { ComplaintDocument } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { Search, X, ChevronRight, Filter } from "lucide-react";

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
    badgeClass: "bg-sky-50/80 text-sky-900 border-sky-200 font-medium",
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
  urgent: "bg-[#FAF0EE] text-[#8B342E] border-[#E5C9C6] font-bold",
};

export default function ComplaintsTableClient({
  complaints,
}: {
  complaints: ComplaintDocument[];
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");

  const filtered = complaints.filter((c) => {
    const matchSearch =
      !search ||
      (c.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.ticketNumber || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.citizenName && c.citizenName.toLowerCase().includes(search.toLowerCase())) ||
      (c.location?.address && c.location.address.toLowerCase().includes(search.toLowerCase()));

    const matchStatus = status === "all" || c.status === status;
    const matchCat = category === "all" || c.category === category;
    return matchSearch && matchStatus && matchCat;
  });

  const isFiltered = search.trim().length > 0 || status !== "all" || category !== "all";

  return (
    <div className="space-y-4">
      {/* Filters Toolbar */}
      <div className="bg-[#FAF8F2] p-3.5 rounded-sm border border-[#DDD9CE] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#77796F]" />
            <Input
              placeholder="Search by ticket, title, citizen, or ward..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 border-[#DDD9CE] bg-[#F7F5EE] text-xs sm:text-sm focus-visible:ring-[#1B3A2E]"
            />
          </div>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40 border-[#DDD9CE] bg-[#F7F5EE] text-xs sm:text-sm focus:ring-[#1B3A2E]">
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

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-48 border-[#DDD9CE] bg-[#F7F5EE] text-xs sm:text-sm focus:ring-[#1B3A2E]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="roads_potholes">Roads & Potholes</SelectItem>
              <SelectItem value="garbage_collection">Garbage Collection</SelectItem>
              <SelectItem value="water_leakage">Water Leakage</SelectItem>
              <SelectItem value="drainage">Drainage & Sewage</SelectItem>
              <SelectItem value="streetlights">Streetlights</SelectItem>
              <SelectItem value="public_infrastructure">Public Infrastructure</SelectItem>
              <SelectItem value="sanitation">Sanitation</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[#77796F]">
            Displaying <strong className="text-[#252820]">{filtered.length}</strong> of {complaints.length} records
          </span>
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setStatus("all");
                setCategory("all");
              }}
              className="text-xs text-[#1B3A2E] hover:text-[#252820] h-8 px-2 flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* Registry Table */}
      <div className="overflow-x-auto rounded-sm border border-[#DDD9CE] bg-[#FAF8F2]">
        <table className="min-w-full text-xs text-left">
          <thead className="bg-[#ECE9DF]/60 text-[#252820] border-b border-[#DDD9CE]">
            <tr>
              <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] text-[#77796F]">Ticket</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] text-[#77796F]">Grievance Particulars</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] text-[#77796F]">Category</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] text-[#77796F]">Priority</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] text-[#77796F]">Status</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] text-[#77796F]">Filed</th>
              <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider text-[11px] text-[#77796F]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DDD9CE]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[#77796F]">
                  <p className="font-serif font-medium text-base text-[#252820]">No complaints match current filters</p>
                  <p className="text-xs mt-1">Try resetting the search terms or status selection.</p>
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const st = STATUS_CONFIG[c.status] || {
                  label: c.status.replace(/_/g, " "),
                  badgeClass: "bg-[#ECE9DF] text-[#252820] border-[#DDD9CE]",
                  dotClass: "bg-[#718267]",
                };

                return (
                  <tr key={c.id} className="hover:bg-[#ECE9DF]/40 transition-colors">
                    {/* Ticket */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-mono text-[11px] font-medium text-[#1B3A2E] bg-[#ECE9DF] px-2 py-0.5 rounded-sm border border-[#DDD9CE]">
                        {c.ticketNumber || `#${c.id.slice(0, 8).toUpperCase()}`}
                      </span>
                    </td>

                    {/* Title & Citizen Info */}
                    <td className="px-4 py-3.5 max-w-xs">
                      <p className="font-semibold text-xs text-[#252820] truncate">
                        {c.title}
                      </p>
                      <p className="text-[11px] text-[#77796F] truncate mt-0.5">
                        {c.citizenName || "Anonymous"} · {c.location?.address || "Address unspecified"}
                      </p>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-[#77796F] capitalize">
                      {c.categoryLabel || (c.category ? c.category.replace(/_/g, " ") : "General")}
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-sm border text-[11px] uppercase ${
                          PRIORITY_BADGES[c.priority] || "bg-[#ECE9DF] text-[#252820]"
                        }`}
                      >
                        {c.priority}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm border text-[11px] font-medium ${st.badgeClass}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${st.dotClass}`} />
                        {st.label}
                      </span>
                    </td>

                    {/* Filed Date */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-[#77796F] text-[11px]">
                      {(() => {
                        if (!c.createdAt) return "—";
                        try {
                          const d =
                            typeof (c.createdAt as any)?.toDate === "function"
                              ? (c.createdAt as any).toDate()
                              : (c.createdAt as any)?.seconds
                              ? new Date((c.createdAt as any).seconds * 1000)
                              : new Date(c.createdAt as string);
                          return formatDistanceToNow(d, { addSuffix: true });
                        } catch {
                          return "—";
                        }
                      })()}
                    </td>

                    {/* Review CTA */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <Link href={`/admin/complaints/${c.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs border-[#DDD9CE] hover:border-[#1B3A2E] hover:bg-[#ECE9DF] text-[#252820] font-medium h-7 px-2.5"
                        >
                          Review <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
