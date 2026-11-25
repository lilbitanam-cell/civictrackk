import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentSession } from "@/lib/auth/session";
import {
  getComplaintDocumentByIdServer as getComplaintById,
  getComplaintHistoryServer as getComplaintHistory,
  getActiveDepartmentsServer as getActiveDepartments,
} from "@/services/server/complaints.server";
import AdminLayout from "@/components/admin/AdminLayout";
import { LoadingState } from "@/components/shared/loading-state";
import AdminComplaintActions from "./AdminComplaintActions";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  MapPin,
  Tag,
  User,
  Building,
  Calendar,
  Clock,
  ShieldCheck,
  AlertCircle,
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

async function ComplaintReviewContent({
  id,
}: {
  id: string;
}) {
  const session = await getCurrentSession();
  if (!session || session.role !== "admin")
    redirect("/unauthorized?reason=admin_required");

  const [complaint, history, departments] = await Promise.all([
    getComplaintById(id),
    getComplaintHistory(id),
    getActiveDepartments(),
  ]);

  if (!complaint) notFound();

  const st = STATUS_CONFIG[complaint.status] || {
    label: complaint.status.replace(/_/g, " "),
    badgeClass: "bg-gray-100 text-gray-800 border-gray-200",
    dotClass: "bg-gray-400",
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Return link */}
      <div>
        <Link
          href="/admin/complaints"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1B3A2E] hover:underline transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Complaints Registry
        </Link>
      </div>

      {/* Header */}
      <div className="bg-[#FAF8F2] border border-[#DDD9CE] rounded-sm p-5 sm:p-6 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-medium text-[#1B3A2E] bg-[#ECE9DF] px-2 py-0.5 rounded-sm border border-[#DDD9CE]">
                {complaint.ticketNumber}
              </span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-sm border uppercase ${
                  PRIORITY_BADGES[complaint.priority] || "bg-[#ECE9DF]"
                }`}
              >
                Priority: {complaint.priority}
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
      </div>

      {/* Meta Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
            <User className="h-3 w-3 text-[#718267]" /> Complainant Citizen
          </span>
          <p className="text-xs font-semibold text-[#252820] truncate">
            {complaint.citizenName}
          </p>
        </div>

        <div className="bg-[#FAF8F2] border border-[#DDD9CE] rounded-sm p-3.5 space-y-1">
          <span className="text-[11px] text-[#77796F] flex items-center gap-1 font-medium">
            <Building className="h-3 w-3 text-[#718267]" /> Department
          </span>
          <p className="text-xs font-semibold text-[#252820] truncate">
            {complaint.departmentName || "Unassigned"}
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

      {/* Location Bar */}
      <div className="bg-[#FAF8F2] border border-[#DDD9CE] rounded-sm p-4 space-y-1.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#77796F] flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-[#718267]" /> Ward & Geographic Location
        </h3>
        <p className="text-xs sm:text-sm font-medium text-[#252820]">
          {complaint.location?.address || "Address not specified"}
          {complaint.location?.city ? `, ${complaint.location.city}` : ""}
          {complaint.location?.landmark ? ` (Near ${complaint.location.landmark})` : ""}
        </p>
        {complaint.location?.latitude && complaint.location?.longitude && (
          <p className="text-[11px] font-mono text-[#77796F]">
            Coordinates: {complaint.location.latitude.toFixed(5)}, {complaint.location.longitude.toFixed(5)}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="bg-[#FAF8F2] border border-[#DDD9CE] rounded-sm p-5 space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#77796F]">
          Complainant Statement & Particulars
        </h3>
        <p className="text-xs sm:text-sm text-[#252820] whitespace-pre-wrap leading-relaxed">
          {complaint.description}
        </p>
      </div>

      {/* Citizen Images */}
      {complaint.images && complaint.images.length > 0 && (
        <div className="bg-[#FAF8F2] border border-[#DDD9CE] rounded-sm p-5 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#77796F]">
            Photographic Evidence from Complainant ({complaint.images.length})
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
                  alt={`Citizen photo ${i + 1}`}
                  className="w-full h-36 object-cover group-hover:scale-105 transition-transform"
                />
                <span className="absolute bottom-1 right-1 text-[10px] bg-[#252820]/75 text-[#F7F5EE] px-1.5 py-0.5 rounded-sm">
                  Enlarge
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Rejection notice if rejected */}
      {complaint.rejectionReason && (
        <div className="bg-[#FAF0EE] border border-[#E5C9C6] rounded-sm p-4 text-xs text-[#8B342E] space-y-1">
          <p className="font-semibold text-[#8B342E] flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 text-[#8B342E]" /> Rejection Record
          </p>
          <p className="leading-relaxed">{complaint.rejectionReason}</p>
        </div>
      )}

      {/* Operations & Workflow Actions */}
      <AdminComplaintActions
        complaint={complaint}
        departments={departments}
        session={session}
      />

      {/* Official Audit Timeline */}
      {history.length > 0 && (
        <div className="bg-[#FAF8F2] border border-[#DDD9CE] rounded-sm p-5 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#77796F] flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-[#718267]" /> Municipal Audit & Lifecycle Log
          </h3>

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
                  Action taken by: <span className="text-[#252820] font-medium">{entry.actorName}</span> ({entry.actorRole})
                </p>
                {entry.notes && (
                  <p className="text-xs text-[#263D30] bg-[#F7F5EE] p-2 rounded-sm border border-[#DDD9CE] mt-1.5 leading-relaxed">
                    {entry.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default async function AdminComplaintReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AdminLayout>
      <Suspense fallback={<LoadingState message="Loading complaint review..." />}>
        <ComplaintReviewContent id={id} />
      </Suspense>
    </AdminLayout>
  );
}
