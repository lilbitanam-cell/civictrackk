import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentSession } from "@/lib/auth/session";
import {
  getComplaintDocumentByIdServer as getComplaintById,
  getComplaintHistoryServer as getComplaintHistory,
} from "@/services/server/complaints.server";
import { LoadingState } from "@/components/shared/loading-state";
import DashboardLayout from "@/components/citizen/DashboardLayout";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  Tag,
  Building,
  User,
  Calendar,
  FileCheck2,
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

const formatDateExact = (dateVal: any) => {
  if (!dateVal) return "—";
  try {
    const d =
      typeof dateVal.toDate === "function"
        ? dateVal.toDate()
        : dateVal.seconds
        ? new Date(dateVal.seconds * 1000)
        : new Date(dateVal);
    return d.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
};

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

const LIFECYCLE_STEPS = [
  { key: "submitted", label: "Submitted" },
  { key: "under_review", label: "Under Review" },
  { key: "assigned", label: "Assigned" },
  { key: "in_progress", label: "In Progress" },
  { key: "resolved", label: "Resolved" },
];

function getStepIndex(status: string): number {
  switch (status) {
    case "submitted":
      return 0;
    case "under_review":
      return 1;
    case "assigned":
      return 2;
    case "in_progress":
      return 3;
    case "resolution_submitted":
      return 3;
    case "resolved":
    case "closed":
      return 4;
    case "rejected":
      return -1;
    default:
      return 0;
  }
}

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const [complaint, history] = await Promise.all([
    getComplaintById(id),
    getComplaintHistory(id),
  ]);

  if (!complaint) notFound();
  if (complaint.citizenId !== session.uid)
    redirect("/unauthorized?reason=forbidden");

  const stepIndex = getStepIndex(complaint.status);
  const isRejected = complaint.status === "rejected";

  const st = STATUS_CONFIG[complaint.status] || {
    label: complaint.status.replace(/_/g, " "),
    badgeClass: "bg-gray-100 text-gray-800 border-gray-200",
    dotClass: "bg-gray-400",
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Return link */}
      <div>
        <Link
          href="/citizen/complaints"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#536247] hover:text-[#30352D] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to My Grievances
        </Link>
      </div>

      {/* Main Header Card */}
      <div className="bg-white border border-[#E5E8DF] rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-medium text-[#536247] bg-[#F1F3EC] px-2 py-0.5 rounded border border-[#E5E8DF]">
                {complaint.ticketNumber}
              </span>
              <span className="text-xs text-[#74796F] capitalize">
                Priority: <strong className="text-[#30352D]">{complaint.priority}</strong>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#30352D]">
              {complaint.title}
            </h1>
          </div>

          <span
            className={`self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${st.badgeClass}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${st.dotClass}`} />
            {st.label}
          </span>
        </div>

        {/* Lifecycle Tracker */}
        {!isRejected ? (
          <div className="pt-4 border-t border-[#F1F3EC]">
            <p className="text-[11px] font-semibold text-[#74796F] uppercase tracking-wider mb-3">
              Resolution Pipeline
            </p>
            <div className="grid grid-cols-5 gap-1 sm:gap-2">
              {LIFECYCLE_STEPS.map((step, idx) => {
                const isPassed = stepIndex >= idx;
                const isCurrent = stepIndex === idx;

                return (
                  <div key={step.key} className="flex flex-col items-center text-center">
                    <div
                      className={`h-2 w-full rounded-full transition-all ${
                        isPassed
                          ? "bg-[#536247]"
                          : "bg-[#E5E8DF]"
                      }`}
                    />
                    <span
                      className={`text-[10px] sm:text-xs mt-1.5 truncate capitalize ${
                        isCurrent
                          ? "text-[#30352D] font-bold"
                          : isPassed
                          ? "text-[#536247] font-medium"
                          : "text-[#74796F]"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="pt-3 border-t border-red-100 bg-red-50/50 -mx-5 -mb-5 p-4 rounded-b-lg border-b border-red-200 flex items-start gap-3 text-red-800 text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Grievance Not Accepted / Rejected</p>
              <p className="mt-0.5 text-red-700 leading-relaxed">
                {complaint.rejectionReason || "This issue could not be accepted under municipal jurisdiction."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Meta Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-[#E5E8DF] rounded-md p-3.5 space-y-1">
          <span className="text-[11px] text-[#74796F] flex items-center gap-1 font-medium">
            <Tag className="h-3 w-3 text-[#788568]" /> Category
          </span>
          <p className="text-xs font-semibold text-[#30352D] capitalize">
            {complaint.categoryLabel || complaint.category.replace(/_/g, " ")}
          </p>
        </div>

        <div className="bg-white border border-[#E5E8DF] rounded-md p-3.5 space-y-1">
          <span className="text-[11px] text-[#74796F] flex items-center gap-1 font-medium">
            <Building className="h-3 w-3 text-[#788568]" /> Department
          </span>
          <p className="text-xs font-semibold text-[#30352D]">
            {complaint.departmentName || "Pending Assignment"}
          </p>
        </div>

        <div className="bg-white border border-[#E5E8DF] rounded-md p-3.5 space-y-1">
          <span className="text-[11px] text-[#74796F] flex items-center gap-1 font-medium">
            <User className="h-3 w-3 text-[#788568]" /> Assigned Worker
          </span>
          <p className="text-xs font-semibold text-[#30352D]">
            {complaint.assignedWorkerName || "Awaiting Dispatch"}
          </p>
        </div>

        <div className="bg-white border border-[#E5E8DF] rounded-md p-3.5 space-y-1">
          <span className="text-[11px] text-[#74796F] flex items-center gap-1 font-medium">
            <Calendar className="h-3 w-3 text-[#788568]" /> Date Filed
          </span>
          <p className="text-xs font-semibold text-[#30352D]">
            {formatDateSafe(complaint.createdAt)}
          </p>
        </div>
      </div>

      {/* Location Card */}
      <div className="bg-white border border-[#E5E8DF] rounded-lg p-4 space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#74796F] flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-[#788568]" /> Location Particulars
        </h3>
        <p className="text-sm font-medium text-[#30352D]">
          {complaint.location?.address || "Address not provided"}
          {complaint.location?.city ? `, ${complaint.location.city}` : ""}
        </p>
        {complaint.location?.landmark && (
          <p className="text-xs text-[#74796F]">
            Landmark: <span className="text-[#30352D]">{complaint.location.landmark}</span>
          </p>
        )}
        {complaint.location?.latitude && complaint.location?.longitude && (
          <p className="text-[11px] font-mono text-[#74796F]">
            Geo Coordinates: {complaint.location.latitude.toFixed(5)}, {complaint.location.longitude.toFixed(5)}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="bg-white border border-[#E5E8DF] rounded-lg p-5 space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#74796F]">
          Grievance Description
        </h3>
        <p className="text-sm text-[#30352D] whitespace-pre-wrap leading-relaxed">
          {complaint.description}
        </p>
      </div>

      {/* Citizen Images */}
      {complaint.images && complaint.images.length > 0 && (
        <div className="bg-white border border-[#E5E8DF] rounded-lg p-5 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#74796F]">
            Citizen Photographs ({complaint.images.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                  alt={`Report photo ${i + 1}`}
                  className="w-full h-36 object-cover group-hover:scale-105 transition-transform"
                />
                <span className="absolute bottom-1 right-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                  View
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Resolution Evidence Box (when available) */}
      {complaint.resolutionImages && complaint.resolutionImages.length > 0 && (
        <div className="bg-white border border-[#788568] rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#30352D] flex items-center gap-1.5">
              <FileCheck2 className="h-4 w-4 text-[#536247]" /> On-Site Resolution Evidence
            </h3>
            <span className="text-xs text-[#536247] font-medium bg-[#E9EDE4] px-2.5 py-0.5 rounded-full">
              Verified by Field Personnel
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            {(complaint.resolutionImages || []).map((url: string, i: number) => (
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
                  alt={`Resolution evidence ${i + 1}`}
                  className="w-full h-36 object-cover group-hover:scale-105 transition-transform"
                />
                <span className="absolute bottom-1 right-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                  Resolved Proof
                </span>
              </a>
            ))}
          </div>

          {complaint.resolutionNotes && (
            <div className="mt-3 p-3 bg-[#F8F9F5] rounded-md border border-[#E5E8DF] text-xs text-[#536247]">
              <strong className="text-[#30352D]">Field Completion Notes:</strong> {complaint.resolutionNotes}
            </div>
          )}
        </div>
      )}

      {/* Admin remarks */}
      {complaint.adminRemarks && (
        <div className="bg-[#F1F3EC] border border-[#D8DDD1] rounded-lg p-4 text-xs text-[#30352D] space-y-1">
          <p className="font-semibold text-[#536247] uppercase tracking-wide">
            Administrative Remarks
          </p>
          <p className="leading-relaxed">{complaint.adminRemarks}</p>
        </div>
      )}

      {/* Official Audit Timeline */}
      <div className="bg-white border border-[#E5E8DF] rounded-lg p-5 space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#74796F] flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-[#788568]" /> Official Progress History
        </h3>

        {history.length === 0 ? (
          <p className="text-xs text-[#74796F] py-2">No activity recorded yet.</p>
        ) : (
          <div className="relative border-l-2 border-[#E5E8DF] ml-3 space-y-5 pt-1">
            {history.map((entry) => (
              <div key={entry.id} className="relative pl-5">
                <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-[#788568] border-2 border-white" />
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-[#30352D] capitalize">
                    {entry.action.replace(/_/g, " ")}
                    {entry.newStatus && ` → ${entry.newStatus.replace(/_/g, " ")}`}
                  </p>
                  <span className="text-[11px] text-[#74796F]">
                    {formatDateSafe(entry.createdAt)}
                  </span>
                </div>
                <p className="text-[11px] text-[#74796F] mt-0.5">
                  Logged by: <span className="text-[#30352D] font-medium">{entry.actorName}</span> ({entry.actorRole})
                </p>
                {entry.notes && (
                  <p className="text-xs text-[#536247] bg-[#F8F9F5] p-2 rounded border border-[#E5E8DF] mt-1.5 leading-relaxed">
                    {entry.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CitizenComplaintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <DashboardLayout>
      <Suspense fallback={<LoadingState message="Loading complaint details..." />}>
        <Content params={params} />
      </Suspense>
    </DashboardLayout>
  );
}
