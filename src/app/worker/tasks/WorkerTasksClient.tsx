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
    badgeClass: "bg-amber-50/80 text-amber-900 border-amber-200/80",
    dotClass: "bg-amber-600",
  },
  accepted: {
    label: "Acknowledged",
    badgeClass: "bg-[#ECE9DF] text-[#1B3A2E] border-[#718267]",
    dotClass: "bg-[#1B3A2E]",
  },
  in_progress: {
    label: "In Progress",
    badgeClass: "bg-[#718267] text-white border-transparent",
    dotClass: "bg-white",
  },
  completed: {
    label: "Submitted for Audit",
    badgeClass: "bg-sky-50/80 text-sky-900 border-sky-200",
    dotClass: "bg-sky-600",
  },
  on_hold: {
    label: "On Hold",
    badgeClass: "bg-[#ECE9DF] text-[#77796F] border-[#DDD9CE]",
    dotClass: "bg-[#77796F]",
  },
};

const PRIORITY_BADGES: Record<string, string> = {
  low: "bg-[#F7F5EE] text-[#77796F] border-[#DDD9CE]",
  medium: "bg-amber-50/80 text-amber-900 border-amber-200/80",
  high: "bg-orange-50/80 text-orange-900 border-orange-200/80 font-medium",
  urgent: "bg-[#FAF0EE] text-[#8B342E] border-[#E5C9C6] font-bold",
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
      <div className="bg-[#FAF8F2] p-3.5 rounded-sm border border-[#DDD9CE] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#77796F]" />
            <Input
              placeholder="Search title, ticket, or ward..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 border-[#DDD9CE] bg-[#F7F5EE] text-xs sm:text-sm focus-visible:ring-[#1B3A2E]"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 sm:w-40 border-[#DDD9CE] bg-[#F7F5EE] text-xs sm:text-sm focus:ring-[#1B3A2E]">
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
            <SelectTrigger className="w-32 sm:w-36 border-[#DDD9CE] bg-[#F7F5EE] text-xs sm:text-sm focus:ring-[#1B3A2E]">
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
          <span className="text-xs text-[#77796F]">
            Tasks: <strong className="text-[#252820]">{filtered.length}</strong> of {tasks.length}
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
              className="text-xs text-[#1B3A2E] hover:text-[#252820] h-8 px-2 flex items-center gap-1"
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

            let formattedTime = "";
            try {
              if (task.createdAt) {
                const raw = task.createdAt as any;
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
              formattedTime = "";
            }

            return (
              <Link
                key={task.id}
                href={`/worker/tasks/${task.id}`}
                className="block group"
              >
                <div
                  className={`bg-[#FAF8F2] border rounded-sm p-4 sm:p-5 hover:border-[#718267] transition-all space-y-3 ${
                    task.priority === "urgent"
                      ? "border-[#E5C9C6] bg-[#FAF0EE]/50"
                      : "border-[#DDD9CE]"
                  }`}
                >
                  {/* Top Badge Strip */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-medium text-[#1B3A2E] bg-[#ECE9DF] px-2 py-0.5 rounded-sm border border-[#DDD9CE]">
                        {task.complaintTicketNumber || `#${task.id.slice(0, 6)}`}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-sm border uppercase ${
                          PRIORITY_BADGES[task.priority] || "bg-[#ECE9DF]"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm border text-xs font-medium ${st.badgeClass}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${st.dotClass}`} />
                      {st.label}
                    </span>
                  </div>

                  {/* Title & Category */}
                  <div>
                    <h3 className="font-serif text-base sm:text-lg font-medium text-[#252820] group-hover:text-[#1B3A2E] transition-colors">
                      {task.complaintTitle}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-[#77796F] mt-1">
                      <span className="capitalize">
                        {task.complaintCategory?.replace(/_/g, " ")}
                      </span>
                      {formattedTime && (
                        <span className="flex items-center gap-1 text-[11px]">
                          <Clock className="h-3 w-3" />
                          {formattedTime}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Location & CTA */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-[#DDD9CE]/70 text-xs">
                    <span className="flex items-center gap-1.5 text-[#1B3A2E] font-medium truncate">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-[#718267]" />
                      <span className="truncate">
                        {task.location?.address || "Address unspecified"}
                      </span>
                    </span>

                    <span className="text-xs text-[#1B3A2E] font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2">
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
