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

async function Content({ id }: { id: string }) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const [complaint, history] = await Promise.all([
    getComplaintById(id),
    getComplaintHistory(id),
  ]);

  if (!complaint) notFound();
  if (complaint.citizenId !== session.uid && session.role !== "admin")
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
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1B3A2E] hover:underline transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to My Grievances
        </Link>
      </div>

      {/* Main Header Card */}
      <div className="bg-[#FAF8F2] border border-[#DDD9CE] rounded-sm p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-medium text-[#1B3A2E] bg-[#ECE9DF] px-2 py-0.5 rounded-sm border border-[#DDD9CE]">
                {complaint.ticketNumber}
              </span>
              <span className="text-xs text-[#77796F] capitalize">
                Priority: <strong className="text-[#252820]">{complaint.priority}</strong>
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1B3A2E]">
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
          <div className="pt-4 border-t border-[#DDD9CE]">
            <p className="text-[11px] font-semibold text-[#77796F] uppercase tracking-wider mb-3">
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
                          ? "bg-[#1B3A2E]"
                          : "bg-[#DDD9CE]"
                      }`}
                    />
                    <span
                      className={`text-[10px] sm:text-xs mt-1.5 truncate capitalize ${
                        isCurrent
                          ? "text-[#252820] font-semibold"
                          : isPassed
                          ? "text-[#1B3A2E] font-medium"
                          : "text-[#77796F]"
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
          <div className="pt-3 border-t border-[#E5C9C6] bg-[#FAF0EE] -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 p-4 rounded-b-sm border-b border-[#E5C9C6] flex items-start gap-3 text-[#8B342E] text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0 text-[#8B342E] mt-0.5" />
            <div>
              <p className="font-semibold text-[#8B342E]">Grievance Not Accepted / Rejected</p>
              <p className="mt-0.5 text-[#8B342E]/90 leading-relaxed">
                {complaint.rejectionReason || "This issue could not be accepted under municipal jurisdiction."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Meta Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#FAF8F2] border border-[#DDD9CE] rounded-sm p-3.5 space-y-1">
          <span className="text-[11px] text-[#77796F] flex items-center gap-1 font-medium">
            <Tag className="h-3 w-3 text-[#718267]" /> Category
          </span>
          <p className="text-xs font-semibold text-[#252820] capitalize">
            {complaint.categoryLabel || complaint.category.replace(/_/g, " ")}
          </p>
        </div>

        <div className="bg-[#FAF8F2] border border-[#DDD9CE] rounded-sm p-3.5 space-y-1">
          <span className="text-[11px] text-[#77796F] flex items-center gap-1 font-medium">
            <Building className="h-3 w-3 text-[#718267]" /> Department
          </span>
          <p className="text-xs font-semibold text-[#252820]">
            {complaint.departmentName || "Pending Assignment"}
          </p>
        </div>

        <div className="bg-[#FAF8F2] border border-[#DDD9CE] rounded-sm p-3.5 space-y-1">
          <span className="text-[11px] text-[#77796F] flex items-center gap-1 font-medium">
            <User className="h-3 w-3 text-[#718267]" /> Assigned Worker
          </span>
          <p className="text-xs font-semibold text-[#252820]">
            {complaint.assignedWorkerName || "Awaiting Dispatch"}
          </p>
        </div>

        <div className="bg-[#FAF8F2] border border-[#DDD9CE] rounded-sm p-3.5 space-y-1">
          <span className="text-[11px] text-[#77796F] flex items-center gap-1 font-medium">
            <Calendar className="h-3 w-3 text-[#718267]" /> Date Filed
          </span>
          <p className="text-xs font-semibold text-[#252820]">
            {formatDateSafe(complaint.createdAt)}
          </p>
        </div>
      </div>

      {/* Location Card */}
      <div className="bg-[#FAF8F2] border border-[#DDD9CE] rounded-sm p-4 space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#77796F] flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-[#718267]" /> Location Particulars
        </h3>
        <p className="text-sm font-medium text-[#252820]">
          {complaint.location?.address || "Address not provided"}
          {complaint.location?.city ? `, ${complaint.location.city}` : ""}
        </p>
        {complaint.location?.landmark && (
          <p className="text-xs text-[#77796F]">
            Landmark: <span className="text-[#252820]">{complaint.location.landmark}</span>
          </p>
        )}
        {complaint.location?.latitude && complaint.location?.longitude && (
          <p className="text-[11px] font-mono text-[#77796F]">
            Geo Coordinates: {complaint.location.latitude.toFixed(5)}, {complaint.location.longitude.toFixed(5)}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="bg-[#FAF8F2] border border-[#DDD9CE] rounded-sm p-5 space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#77796F]">
          Grievance Description
        </h3>
        <p className="text-sm text-[#252820] whitespace-pre-wrap leading-relaxed">
          {complaint.description}
        </p>
      </div>

      {/* Citizen Images */}
      {complaint.images && complaint.images.length > 0 && (
        <div className="bg-[#FAF8F2] border border-[#DDD9CE] rounded-sm p-5 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#77796F]">
            Citizen Photographs ({complaint.images.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(complaint.images || []).map((url: string, i: number) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="group relative rounded-sm overflow-hidden border border-[#DDD9CE] block bg-[#ECE9DF]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Report photo ${i + 1}`}
                  className="w-full h-36 object-cover group-hover:scale-105 transition-transform"
                />
                <span className="absolute bottom-1 right-1 text-[10px] bg-[#252820]/75 text-[#F7F5EE] px-1.5 py-0.5 rounded-sm">
                  View
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Resolution Evidence Box (when available) */}
      {complaint.resolutionImages && complaint.resolutionImages.length > 0 && (
        <div className="bg-[#FAF8F2] border border-[#1B3A2E] rounded-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-base font-medium text-[#1B3A2E] flex items-center gap-1.5">
              <FileCheck2 className="h-4 w-4 text-[#1B3A2E]" /> On-Site Resolution Evidence
            </h3>
            <span className="text-xs text-[#1B3A2E] font-medium bg-[#ECE9DF] px-2.5 py-0.5 rounded-full border border-[#DDD9CE]">
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
                className="group relative rounded-sm overflow-hidden border border-[#DDD9CE] block bg-[#ECE9DF]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Resolution evidence ${i + 1}`}
                  className="w-full h-36 object-cover group-hover:scale-105 transition-transform"
                />
                <span className="absolute bottom-1 right-1 text-[10px] bg-[#1B3A2E]/85 text-[#F7F5EE] px-1.5 py-0.5 rounded-sm">
                  Resolved Proof
                </span>
              </a>
            ))}
          </div>

          {complaint.resolutionNotes && (
            <div className="mt-3 p-3 bg-[#F7F5EE] rounded-sm border border-[#DDD9CE] text-xs text-[#263D30]">
              <strong className="text-[#252820]">Field Completion Notes:</strong> {complaint.resolutionNotes}
            </div>
          )}
        </div>
      )}

      {/* Admin remarks */}
      {complaint.adminRemarks && (
        <div className="bg-[#ECE9DF] border border-[#DDD9CE] rounded-sm p-4 text-xs text-[#252820] space-y-1">
          <p className="font-semibold text-[#1B3A2E] uppercase tracking-wide">
            Administrative Remarks
          </p>
          <p className="leading-relaxed">{complaint.adminRemarks}</p>
        </div>
      )}

      {/* Official Audit Timeline */}
      <div className="bg-[#FAF8F2] border border-[#DDD9CE] rounded-sm p-5 space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#77796F] flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-[#718267]" /> Official Progress History
        </h3>

        {history.length === 0 ? (
          <p className="text-xs text-[#77796F] py-2">No activity recorded yet.</p>
        ) : (
          <div className="relative border-l-2 border-[#DDD9CE] ml-3 space-y-5 pt-1">
            {history.map((entry) => (
              <div key={entry.id} className="relative pl-5">
                <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-[#1B3A2E] border-2 border-[#FAF8F2]" />
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-[#252820] capitalize">
                    {entry.action.replace(/_/g, " ")}
                    {entry.newStatus && ` → ${entry.newStatus.replace(/_/g, " ")}`}
                  </p>
                  <span className="text-[11px] text-[#77796F]">
                    {formatDateSafe(entry.createdAt)}
                  </span>
                </div>
                <p className="text-[11px] text-[#77796F] mt-0.5">
                  Logged by: <span className="text-[#252820] font-medium">{entry.actorName}</span> ({entry.actorRole})
                </p>
                {entry.notes && (
                  <p className="text-xs text-[#263D30] bg-[#F7F5EE] p-2 rounded-sm border border-[#DDD9CE] mt-1.5 leading-relaxed">
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

export default async function CitizenComplaintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <DashboardLayout>
      <Suspense fallback={<LoadingState message="Loading complaint details..." />}>
        <Content id={id} />
      </Suspense>
    </DashboardLayout>
  );
}
