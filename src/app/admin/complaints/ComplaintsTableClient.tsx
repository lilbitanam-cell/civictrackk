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
    badgeClass: "bg-blue-50 text-blue-800 border-blue-200 font-medium",
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
  urgent: "bg-red-50 text-red-700 border-red-200 font-bold",
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
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
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
      <div className="bg-white p-3.5 rounded-lg border border-[#E5E8DF] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#74796F]" />
            <Input
              placeholder="Search by ticket, title, citizen, or ward..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 border-[#E5E8DF] text-xs sm:text-sm focus-visible:ring-[#788568]"
            />
          </div>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40 border-[#E5E8DF] text-xs sm:text-sm focus:ring-[#788568]">
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
            <SelectTrigger className="w-48 border-[#E5E8DF] text-xs sm:text-sm focus:ring-[#788568]">
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
          <span className="text-xs text-[#74796F]">
            Displaying <strong className="text-[#30352D]">{filtered.length}</strong> of {complaints.length} records
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
              className="text-xs text-[#536247] hover:text-[#30352D] h-8 px-2 flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* Registry Table */}
      <div className="overflow-x-auto rounded-lg border border-[#E5E8DF] bg-white shadow-xs">
        <table className="min-w-full text-xs text-left">
          <thead className="bg-[#F8F9F5] text-[#30352D] border-b border-[#E5E8DF]">
            <tr>
              <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] text-[#74796F]">Ticket</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] text-[#74796F]">Grievance Particulars</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] text-[#74796F]">Category</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] text-[#74796F]">Priority</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] text-[#74796F]">Status</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] text-[#74796F]">Filed</th>
              <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider text-[11px] text-[#74796F]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E8DF]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[#74796F]">
                  <p className="font-medium text-sm text-[#30352D]">No complaints match current filters</p>
                  <p className="text-xs mt-1">Try resetting the search terms or status selection.</p>
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const st = STATUS_CONFIG[c.status] || {
                  label: c.status.replace(/_/g, " "),
                  badgeClass: "bg-gray-100 text-gray-800 border-gray-200",
                  dotClass: "bg-gray-400",
                };

                return (
                  <tr key={c.id} className="hover:bg-[#F8F9F5] transition-colors">
                    {/* Ticket */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-mono text-[11px] font-medium text-[#536247] bg-[#F1F3EC] px-2 py-0.5 rounded border border-[#E5E8DF]">
                        {c.ticketNumber || `#${c.id.slice(0, 8).toUpperCase()}`}
                      </span>
                    </td>

                    {/* Title & Citizen Info */}
                    <td className="px-4 py-3.5 max-w-xs">
                      <p className="font-semibold text-xs text-[#30352D] truncate">
                        {c.title}
                      </p>
                      <p className="text-[11px] text-[#74796F] truncate mt-0.5">
                        {c.citizenName || "Anonymous"} · {c.location?.address || "Address unspecified"}
                      </p>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-[#74796F] capitalize">
                      {c.categoryLabel || (c.category ? c.category.replace(/_/g, " ") : "General")}
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded border text-[11px] uppercase ${
                          PRIORITY_BADGES[c.priority] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {c.priority}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border text-[11px] font-medium ${st.badgeClass}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${st.dotClass}`} />
                        {st.label}
                      </span>
                    </td>

                    {/* Filed Date */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-[#74796F] text-[11px]">
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
                          className="text-xs border-[#E5E8DF] hover:border-[#788568] hover:bg-[#F1F3EC] text-[#30352D] font-medium h-7 px-2.5"
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
