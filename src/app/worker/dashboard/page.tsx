export const dynamic = 'force-dynamic';
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { getTasksByWorkerServer as getTasksByWorker } from "@/services/server/tasks.server";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import WorkerLayout from "@/components/worker/WorkerLayout";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  ChevronRight,
  ArrowRight,
  ClipboardList,
} from "lucide-react";

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

async function WorkerDashboardContent() {
  const session = await getCurrentSession();
  if (!session || session.role !== "worker")
    redirect("/unauthorized?reason=worker_required");

  const tasks = await getTasksByWorker(session.uid);
  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    accepted: tasks.filter((t) => t.status === "accepted").length,
  };
  const recent = tasks.slice(0, 6);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Field Worker Header Card */}
      <div className="bg-[#FAF8F2] border border-[#DDD9CE] rounded-sm p-5 sm:p-6 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#718267]">
                Active Field Duty
              </span>
              <span className="text-xs text-[#77796F]">· Outdoor Terminal</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1B3A2E] mt-1">
              Field Worker: {session.displayName ?? session.email}
            </h1>
            <p className="text-xs text-[#77796F] mt-1">
              Review assigned civic tasks, navigate to locations, and submit completion photos.
            </p>
          </div>

          <Link href="/worker/tasks">
            <Button className="bg-[#1B3A2E] hover:bg-[#263D30] text-[#F7F5EE] text-xs sm:text-sm font-medium h-10 px-4 w-full sm:w-auto">
              Open Task List ({stats.total}) <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#FAF8F2] border border-[#DDD9CE] rounded-sm p-3.5 text-center sm:text-left">
          <p className="text-[11px] font-medium text-[#77796F] uppercase tracking-wider">
            Pending Action
          </p>
          <p className="font-serif text-2xl font-semibold text-amber-800 mt-1">{stats.pending}</p>
          <p className="text-[10px] text-[#77796F] mt-0.5">Needs acknowledgment</p>
        </div>

        <div className="bg-[#FAF8F2] border border-[#DDD9CE] rounded-sm p-3.5 text-center sm:text-left">
          <p className="text-[11px] font-medium text-[#77796F] uppercase tracking-wider">
            In Progress
          </p>
          <p className="font-serif text-2xl font-semibold text-[#1B3A2E] mt-1">{stats.in_progress}</p>
          <p className="text-[10px] text-[#77796F] mt-0.5">Currently on site</p>
        </div>

        <div className="bg-[#FAF8F2] border border-[#DDD9CE] rounded-sm p-3.5 text-center sm:text-left">
          <p className="text-[11px] font-medium text-[#77796F] uppercase tracking-wider">
            Acknowledged
          </p>
          <p className="font-serif text-2xl font-semibold text-[#252820] mt-1">{stats.accepted}</p>
          <p className="text-[10px] text-[#77796F] mt-0.5">Ready for work</p>
        </div>

        <div className="bg-[#FAF8F2] border border-[#DDD9CE] rounded-sm p-3.5 text-center sm:text-left">
          <p className="text-[11px] font-medium text-[#77796F] uppercase tracking-wider">
            Submitted
          </p>
          <p className="font-serif text-2xl font-semibold text-sky-800 mt-1">{stats.completed}</p>
          <p className="text-[10px] text-[#77796F] mt-0.5">Awaiting audit approval</p>
        </div>
      </div>

      {/* Recent Assigned Tasks */}
      <div className="bg-[#FAF8F2] border border-[#DDD9CE] rounded-sm p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#DDD9CE] pb-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-[#718267]" />
            <h2 className="font-serif text-base font-medium text-[#252820]">
              Recent Task Assignments
            </h2>
          </div>
          <Link
            href="/worker/tasks"
            className="text-xs font-medium text-[#1B3A2E] hover:underline flex items-center gap-1"
          >
            All Tasks ({tasks.length}) <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <EmptyState
            title="No tasks currently assigned"
            description="You have no pending assignments in the municipal queue. Stand by for departmental dispatch."
          />
        ) : (
          <div className="space-y-3">
            {recent.map((task) => {
              const st = STATUS_CONFIG[task.status] || {
                label: task.status.replace(/_/g, " "),
                badgeClass: "bg-[#ECE9DF] text-[#252820] border-[#DDD9CE]",
                dotClass: "bg-[#718267]",
              };

              return (
                <Link
                  key={task.id}
                  href={`/worker/tasks/${task.id}`}
                  className="block group"
                >
                  <div
                    className={`bg-[#F7F5EE] border rounded-sm p-4 hover:border-[#718267] transition-all space-y-2.5 ${
                      task.priority === "urgent"
                        ? "border-[#E5C9C6] bg-[#FAF0EE]/50"
                        : "border-[#DDD9CE]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-medium text-[#1B3A2E] bg-[#ECE9DF] px-2 py-0.5 rounded-sm border border-[#DDD9CE]">
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
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm border text-[11px] font-medium ${st.badgeClass}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${st.dotClass}`} />
                        {st.label}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-serif text-base font-medium text-[#252820] group-hover:text-[#1B3A2E] transition-colors">
                        {task.complaintTitle}
                      </h3>
                      <p className="text-xs text-[#77796F] capitalize mt-0.5">
                        Category: {task.complaintCategory?.replace(/_/g, " ")}
                      </p>
                    </div>

                    {task.location?.address && (
                      <div className="flex items-center justify-between pt-2 border-t border-[#DDD9CE]/70 text-xs">
                        <span className="flex items-center gap-1.5 text-[#1B3A2E] font-medium truncate">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-[#718267]" />
                          <span className="truncate">{task.location.address}</span>
                        </span>
                        <span className="text-[11px] text-[#1B3A2E] font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2">
                          View & Act <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function WorkerDashboardPage() {
  return (
    <WorkerLayout>
      <Suspense fallback={<LoadingState message="Loading your field terminal..." />}>
        <WorkerDashboardContent />
      </Suspense>
    </WorkerLayout>
  );
}
