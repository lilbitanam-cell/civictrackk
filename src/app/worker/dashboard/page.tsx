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
      <div className="bg-white border border-[#E5E8DF] rounded-lg p-5 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#536247] bg-[#E9EDE4] px-2 py-0.5 rounded">
                Active Field Duty
              </span>
              <span className="text-xs text-[#74796F]">Outdoor Terminal</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#30352D] mt-1">
              Field Worker: {session.displayName ?? session.email}
            </h1>
            <p className="text-xs text-[#74796F] mt-0.5">
              Review assigned civic tasks, navigate to locations, and submit completion photos.
            </p>
          </div>

          <Link href="/worker/tasks">
            <Button className="bg-[#788568] hover:bg-[#536247] text-white text-xs sm:text-sm font-semibold h-10 px-4 w-full sm:w-auto">
              Open Task List ({stats.total}) <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-[#E5E8DF] rounded-md p-3.5 text-center sm:text-left">
          <p className="text-[11px] font-medium text-[#74796F] uppercase tracking-wide">
            Pending Action
          </p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{stats.pending}</p>
          <p className="text-[10px] text-[#74796F] mt-0.5">Needs acknowledgment</p>
        </div>

        <div className="bg-white border border-[#E5E8DF] rounded-md p-3.5 text-center sm:text-left">
          <p className="text-[11px] font-medium text-[#74796F] uppercase tracking-wide">
            In Progress
          </p>
          <p className="text-2xl font-bold text-[#536247] mt-1">{stats.in_progress}</p>
          <p className="text-[10px] text-[#74796F] mt-0.5">Currently on site</p>
        </div>

        <div className="bg-white border border-[#E5E8DF] rounded-md p-3.5 text-center sm:text-left">
          <p className="text-[11px] font-medium text-[#74796F] uppercase tracking-wide">
            Acknowledged
          </p>
          <p className="text-2xl font-bold text-[#30352D] mt-1">{stats.accepted}</p>
          <p className="text-[10px] text-[#74796F] mt-0.5">Ready for work</p>
        </div>

        <div className="bg-white border border-[#E5E8DF] rounded-md p-3.5 text-center sm:text-left">
          <p className="text-[11px] font-medium text-[#74796F] uppercase tracking-wide">
            Submitted
          </p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{stats.completed}</p>
          <p className="text-[10px] text-[#74796F] mt-0.5">Awaiting audit approval</p>
        </div>
      </div>

      {/* Recent Assigned Tasks */}
      <div className="bg-white border border-[#E5E8DF] rounded-lg p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#F1F3EC] pb-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-[#788568]" />
            <h2 className="text-sm font-bold text-[#30352D] uppercase tracking-wide">
              Recent Task Assignments
            </h2>
          </div>
          <Link
            href="/worker/tasks"
            className="text-xs font-semibold text-[#536247] hover:underline flex items-center gap-1"
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
                badgeClass: "bg-gray-100 text-gray-800 border-gray-200",
                dotClass: "bg-gray-400",
              };

              return (
                <Link
                  key={task.id}
                  href={`/worker/tasks/${task.id}`}
                  className="block group"
                >
                  <div
                    className={`bg-white border rounded-lg p-4 hover:border-[#788568] hover:shadow-xs transition-all space-y-2.5 ${
                      task.priority === "urgent"
                        ? "border-red-200 bg-red-50/20"
                        : "border-[#E5E8DF]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-medium text-[#536247] bg-[#F1F3EC] px-2 py-0.5 rounded border border-[#E5E8DF]">
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
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border text-[11px] font-medium ${st.badgeClass}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${st.dotClass}`} />
                        {st.label}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-[#30352D] group-hover:text-[#536247] transition-colors">
                        {task.complaintTitle}
                      </h3>
                      <p className="text-xs text-[#74796F] capitalize mt-0.5">
                        Category: {task.complaintCategory?.replace(/_/g, " ")}
                      </p>
                    </div>

                    {task.location?.address && (
                      <div className="flex items-center justify-between pt-2 border-t border-[#F1F3EC] text-xs">
                        <span className="flex items-center gap-1.5 text-[#536247] font-medium truncate">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-[#788568]" />
                          <span className="truncate">{task.location.address}</span>
                        </span>
                        <span className="text-[11px] text-[#536247] font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2">
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
