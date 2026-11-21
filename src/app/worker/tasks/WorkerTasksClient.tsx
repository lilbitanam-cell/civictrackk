"use client";

import { useState } from "react";
import Link from "next/link";
import { WorkerTaskDocument } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Search, MapPin, X, ChevronRight, Clock, Tag } from "lucide-react";

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; dotClass: string }
> = {
  pending: {
    label: "Pending Action",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    dotClass: "bg-amber-500",
  },
  accepted: {
    label: "Acknowledged",
    badgeClass: "bg-[#E9EDE4] text-[#3E4B37] border-[#B4BBA5]",
    dotClass: "bg-[#536247]",
  },
  in_progress: {
    label: "In Progress",
    badgeClass: "bg-[#788568] text-white border-transparent",
    dotClass: "bg-white",
  },
  completed: {
    label: "Submitted for Audit",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
    dotClass: "bg-blue-500",
  },
  on_hold: {
    label: "On Hold",
    badgeClass: "bg-neutral-100 text-neutral-700 border-neutral-300",
    dotClass: "bg-neutral-500",
  },
};

const PRIORITY_BADGES: Record<string, string> = {
  low: "bg-[#F8F9F5] text-[#74796F] border-[#E5E8DF]",
  medium: "bg-amber-50 text-amber-800 border-amber-200",
  high: "bg-orange-50 text-orange-800 border-orange-200 font-medium",
  urgent: "bg-red-50 text-red-700 border-red-200 font-bold",
};

export default function WorkerTasksClient({
  tasks,
}: {
  tasks: WorkerTaskDocument[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const filtered = tasks.filter((t) => {
    const matchSearch =
      !search ||
      t.complaintTitle.toLowerCase().includes(search.toLowerCase()) ||
      (t.complaintTicketNumber &&
        t.complaintTicketNumber.toLowerCase().includes(search.toLowerCase())) ||
      (t.location?.address &&
        t.location.address.toLowerCase().includes(search.toLowerCase()));

    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    const matchPriority =
      priorityFilter === "all" || t.priority === priorityFilter;

    return matchSearch && matchStatus && matchPriority;
  });

  const isFiltered =
    search.trim().length > 0 || statusFilter !== "all" || priorityFilter !== "all";

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Search & Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-lg border border-[#E5E8DF] flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#74796F]" />
            <Input
              placeholder="Search title, ticket, or ward..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 border-[#E5E8DF] text-xs sm:text-sm focus-visible:ring-[#788568]"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 sm:w-40 border-[#E5E8DF] text-xs sm:text-sm focus:ring-[#788568]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Acknowledged</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-32 sm:w-36 border-[#E5E8DF] text-xs sm:text-sm focus:ring-[#788568]">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-xs text-[#74796F]">
            Tasks: <strong className="text-[#30352D]">{filtered.length}</strong> of {tasks.length}
          </span>
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setPriorityFilter("all");
              }}
              className="text-xs text-[#536247] hover:text-[#30352D] h-8 px-2 flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* Task List Cards */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No tasks found"
          description="No field tasks match your search or filter settings."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => {
            const st = STATUS_CONFIG[task.status] || {
              label: task.status.replace(/_/g, " "),
              badgeClass: "bg-gray-100 text-gray-800 border-gray-200",
              dotClass: "bg-gray-400",
            };

            const dateStr = task.createdAt
              ? typeof (task.createdAt as any)?.toDate === "function"
                ? (task.createdAt as any).toDate()
                : (task.createdAt as any)?.seconds
                ? new Date((task.createdAt as any).seconds * 1000)
                : new Date(task.createdAt as string)
              : null;

            return (
              <Link
                key={task.id}
                href={`/worker/tasks/${task.id}`}
                className="block group"
              >
                <div
                  className={`bg-white border rounded-lg p-4 sm:p-5 hover:border-[#788568] hover:shadow-xs transition-all space-y-3 ${
                    task.priority === "urgent"
                      ? "border-red-200 bg-red-50/20"
                      : "border-[#E5E8DF]"
                  }`}
                >
                  {/* Top Badge Strip */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-medium text-[#536247] bg-[#F1F3EC] px-2 py-0.5 rounded border border-[#E5E8DF]">
                        {task.complaintTicketNumber || `#${task.id.slice(0, 6)}`}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border uppercase ${
                          PRIORITY_BADGES[task.priority] || "bg-gray-100"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border text-xs font-medium ${st.badgeClass}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${st.dotClass}`} />
                      {st.label}
                    </span>
                  </div>

                  {/* Title & Category */}
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-[#30352D] group-hover:text-[#536247] transition-colors">
                      {task.complaintTitle}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-[#74796F] mt-1">
                      <span className="capitalize">
                        {task.complaintCategory?.replace(/_/g, " ")}
                      </span>
                      {dateStr && (
                        <span className="flex items-center gap-1 text-[11px]">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(dateStr, { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Location & CTA */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-[#F1F3EC] text-xs">
                    <span className="flex items-center gap-1.5 text-[#536247] font-medium truncate">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-[#788568]" />
                      <span className="truncate">
                        {task.location?.address || "Address unspecified"}
                      </span>
                    </span>

                    <span className="text-xs text-[#536247] font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2">
                      Open Action <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
