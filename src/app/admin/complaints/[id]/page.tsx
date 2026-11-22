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
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#536247] hover:text-[#30352D] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Complaints Registry
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white border border-[#E5E8DF] rounded-lg p-5 sm:p-6 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-medium text-[#536247] bg-[#F1F3EC] px-2 py-0.5 rounded border border-[#E5E8DF]">
                {complaint.ticketNumber}
              </span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded border uppercase ${
                  PRIORITY_BADGES[complaint.priority] || "bg-gray-100"
                }`}
              >
                Priority: {complaint.priority}
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
      </div>

      {/* Meta Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
            <User className="h-3 w-3 text-[#788568]" /> Complainant Citizen
          </span>
          <p className="text-xs font-semibold text-[#30352D] truncate">
            {complaint.citizenName}
          </p>
        </div>

        <div className="bg-white border border-[#E5E8DF] rounded-md p-3.5 space-y-1">
          <span className="text-[11px] text-[#74796F] flex items-center gap-1 font-medium">
            <Building className="h-3 w-3 text-[#788568]" /> Department
          </span>
          <p className="text-xs font-semibold text-[#30352D] truncate">
            {complaint.departmentName || "Unassigned"}
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

      {/* Location Bar */}
      <div className="bg-white border border-[#E5E8DF] rounded-lg p-4 space-y-1.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#74796F] flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-[#788568]" /> Ward & Geographic Location
        </h3>
        <p className="text-xs sm:text-sm font-medium text-[#30352D]">
          {complaint.location?.address || "Address not specified"}
          {complaint.location?.city ? `, ${complaint.location.city}` : ""}
          {complaint.location?.landmark ? ` (Near ${complaint.location.landmark})` : ""}
        </p>
        {complaint.location?.latitude && complaint.location?.longitude && (
          <p className="text-[11px] font-mono text-[#74796F]">
            Coordinates: {complaint.location.latitude.toFixed(5)}, {complaint.location.longitude.toFixed(5)}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="bg-white border border-[#E5E8DF] rounded-lg p-5 space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#74796F]">
          Complainant Statement & Particulars
        </h3>
        <p className="text-xs sm:text-sm text-[#30352D] whitespace-pre-wrap leading-relaxed">
          {complaint.description}
        </p>
      </div>

      {/* Citizen Images */}
      {complaint.images && complaint.images.length > 0 && (
        <div className="bg-white border border-[#E5E8DF] rounded-lg p-5 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#74796F]">
            Photographic Evidence from Complainant ({complaint.images.length})
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

      {/* Rejection notice if rejected */}
      {complaint.rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-xs text-red-800 space-y-1">
          <p className="font-semibold text-red-900 flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 text-red-600" /> Rejection Record
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
        <div className="bg-white border border-[#E5E8DF] rounded-lg p-5 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#74796F] flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-[#788568]" /> Municipal Audit & Lifecycle Log
          </h3>

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
                  Action taken by: <span className="text-[#30352D] font-medium">{entry.actorName}</span> ({entry.actorRole})
                </p>
                {entry.notes && (
                  <p className="text-xs text-[#536247] bg-[#F8F9F5] p-2 rounded border border-[#E5E8DF] mt-1.5 leading-relaxed">
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
