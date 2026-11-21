import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentSession } from "@/lib/auth/session";
import { getTaskByIdServer as getTaskById } from "@/services/server/tasks.server";
import { getComplaintDocumentByIdServer as getComplaintById } from "@/services/server/complaints.server";
import WorkerLayout from "@/components/worker/WorkerLayout";
import { LoadingState } from "@/components/shared/loading-state";
import WorkerTaskActions from "./WorkerTaskActions";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  MapPin,
  Tag,
  Building,
  User,
  Calendar,
  AlertCircle,
  FileText,
  Navigation,
} from "lucide-react";

const formatDateSafe = (dateVal: any) => {
  if (!dateVal) return "—";
  try {
    const d =
      typeof dateVal.toDate === "function"
        ? dateVal.toDate()
        : dateVal.seconds
        ? new Date(dateVal.seconds * 1000)
        : new Date(dateVal);
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return "—";
  }
};

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
};

const PRIORITY_BADGES: Record<string, string> = {
  low: "bg-[#F8F9F5] text-[#74796F] border-[#E5E8DF]",
  medium: "bg-amber-50 text-amber-800 border-amber-200",
  high: "bg-orange-50 text-orange-800 border-orange-200 font-medium",
  urgent: "bg-red-50 text-red-700 border-red-200 font-bold",
};

async function TaskDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getCurrentSession();
  if (!session || session.role !== "worker")
    redirect("/unauthorized?reason=worker_required");

  const task = await getTaskById(id);
  if (!task) notFound();
  if (task.workerId !== session.uid) redirect("/unauthorized?reason=forbidden");

  const complaint = await getComplaintById(task.complaintId);

  const st = STATUS_CONFIG[task.status] || {
    label: task.status.replace(/_/g, " "),
    badgeClass: "bg-gray-100 text-gray-800 border-gray-200",
    dotClass: "bg-gray-400",
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Return link */}
      <div>
        <Link
          href="/worker/tasks"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#536247] hover:text-[#30352D] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to My Task Queue
        </Link>
      </div>

      {/* Header Card */}
      <div className="bg-white border border-[#E5E8DF] rounded-lg p-5 sm:p-6 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-medium text-[#536247] bg-[#F1F3EC] px-2 py-0.5 rounded border border-[#E5E8DF]">
                {task.complaintTicketNumber || `#${task.id.slice(0, 6)}`}
              </span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded border uppercase ${
                  PRIORITY_BADGES[task.priority] || "bg-gray-100"
                }`}
              >
                {task.priority} Priority
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#30352D]">
              {task.complaintTitle}
            </h1>
          </div>

          <span
            className={`self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${st.badgeClass}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${st.dotClass}`} />
            {st.label}
          </span>
        </div>
      </div>

      {/* Location Banner with Directions Link */}
      <div className="bg-white border border-[#E5E8DF] rounded-lg p-4 sm:p-5 space-y-2 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#74796F] flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-[#788568]" /> Target Incident Site
          </h3>
          {task.location?.latitude && task.location?.longitude && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${task.location.latitude},${task.location.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#536247] hover:underline bg-[#F1F3EC] px-2.5 py-1 rounded border border-[#D8DDD1]"
            >
              <Navigation className="h-3 w-3" /> Navigation Link
            </a>
          )}
        </div>
        <p className="text-sm font-semibold text-[#30352D]">
          {task.location?.address || "Address unspecified"}
          {task.location?.city ? `, ${task.location.city}` : ""}
        </p>
        {task.location?.latitude && task.location?.longitude && (
          <p className="text-[11px] font-mono text-[#74796F]">
            Coordinates: {task.location.latitude.toFixed(5)}, {task.location.longitude.toFixed(5)}
          </p>
        )}
      </div>

      {/* Meta Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-[#E5E8DF] rounded-md p-3.5 space-y-1">
          <span className="text-[11px] text-[#74796F] flex items-center gap-1 font-medium">
            <Tag className="h-3 w-3 text-[#788568]" /> Category
          </span>
          <p className="text-xs font-semibold text-[#30352D] capitalize">
            {task.complaintCategory?.replace(/_/g, " ")}
          </p>
        </div>

        <div className="bg-white border border-[#E5E8DF] rounded-md p-3.5 space-y-1">
          <span className="text-[11px] text-[#74796F] flex items-center gap-1 font-medium">
            <User className="h-3 w-3 text-[#788568]" /> Dispatched By
          </span>
          <p className="text-xs font-semibold text-[#30352D] truncate">
            {task.assignedByUserName}
          </p>
        </div>

        <div className="bg-white border border-[#E5E8DF] rounded-md p-3.5 space-y-1">
          <span className="text-[11px] text-[#74796F] flex items-center gap-1 font-medium">
            <Calendar className="h-3 w-3 text-[#788568]" /> Dispatched
          </span>
          <p className="text-xs font-semibold text-[#30352D]">
            {formatDateSafe(task.createdAt)}
          </p>
        </div>

        <div className="bg-white border border-[#E5E8DF] rounded-md p-3.5 space-y-1">
          <span className="text-[11px] text-[#74796F] flex items-center gap-1 font-medium">
            <Calendar className="h-3 w-3 text-[#788568]" /> Work Started
          </span>
          <p className="text-xs font-semibold text-[#30352D]">
            {task.startedAt ? formatDateSafe(task.startedAt) : "Not started yet"}
          </p>
        </div>
      </div>

      {/* Departmental Instructions */}
      {task.instructions && (
        <div className="bg-[#F1F3EC] border border-[#D8DDD1] rounded-lg p-4 sm:p-5 text-xs text-[#30352D] space-y-1 shadow-xs">
          <p className="font-bold uppercase tracking-wider text-[#536247] flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Departmental Instructions
          </p>
          <p className="leading-relaxed pt-0.5">{task.instructions}</p>
        </div>
      )}

      {/* Citizen complaint images */}
      {complaint?.images && complaint.images.length > 0 && (
        <div className="bg-white border border-[#E5E8DF] rounded-lg p-5 space-y-3 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#74796F]">
            Original Grievance Photos ({complaint.images.length})
          </h3>
          <p className="text-xs text-[#74796F]">
            Reference photos captured by the citizen when lodging this ticket.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            {(complaint.images || []).map((url: string, i: number) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="group relative rounded-md overflow-hidden border border-[#E5E8DF] block bg-[#F8F9F5]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Citizen photo ${i + 1}`}
                  className="w-full h-36 object-cover group-hover:scale-105 transition-transform"
                />
                <span className="absolute bottom-1 right-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                  Enlarge
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Evidence images (if completed) */}
      {task.evidenceImages && task.evidenceImages.length > 0 && (
        <div className="bg-white border border-[#788568] rounded-lg p-5 space-y-3 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#536247]">
            Submitted Resolution Evidence ({task.evidenceImages.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            {task.evidenceImages.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="group relative rounded-md overflow-hidden border border-[#E5E8DF] block bg-[#F8F9F5]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Evidence ${i + 1}`}
                  className="w-full h-36 object-cover group-hover:scale-105 transition-transform"
                />
              </a>
            ))}
          </div>
          {task.evidenceNotes && (
            <p className="text-xs text-[#30352D] bg-[#F8F9F5] p-3 rounded border border-[#E5E8DF] mt-2">
              <strong className="text-[#536247]">Completion Notes:</strong> {task.evidenceNotes}
            </p>
          )}
        </div>
      )}

      {/* Action panel */}
      <WorkerTaskActions task={task} />
    </div>
  );
}

export default function WorkerTaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <WorkerLayout>
      <Suspense fallback={<LoadingState message="Loading field task details..." />}>
        <TaskDetailContent params={params} />
      </Suspense>
    </WorkerLayout>
  );
}
