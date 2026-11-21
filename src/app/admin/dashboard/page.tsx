import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  FileText,
  Clock,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  MapPin,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/shared/loading-state";
import { getCurrentSession } from "@/lib/auth/session";
import DashboardLayout from "@/components/admin/AdminLayout";
import {
  getAdminComplaintStatsServer as getAdminComplaintStats,
  getRecentAdminComplaintsServer as getRecentAdminComplaints,
  getHighPriorityComplaintsServer as getHighPriorityComplaints,
} from "@/services/server/complaints.server";
import AdminDashboardCharts from "@/components/admin/AdminDashboardCharts";

const STATUS_BADGES: Record<string, string> = {
  submitted: "bg-[#E9EDE4] text-[#30352D]",
  under_review: "bg-amber-50 text-amber-800 border border-amber-200",
  assigned: "bg-[#B4BBA5] text-[#30352D]",
  in_progress: "bg-[#788568] text-white",
  resolution_submitted: "bg-blue-50 text-blue-800 border border-blue-200 font-semibold",
  resolved: "bg-[#3E4B37] text-white",
  closed: "bg-[#30352D] text-white",
  rejected: "border border-red-200 text-red-700 bg-red-50",
};

const PRIORITY_BADGES: Record<string, string> = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-orange-50 text-orange-700 border-orange-200 font-medium",
  urgent: "bg-red-50 text-red-700 border-red-200 font-semibold",
};

function formatTime(createdAt: any) {
  if (!createdAt) return "—";
  try {
    const d = createdAt?.toDate
      ? createdAt.toDate()
      : createdAt?.seconds
      ? new Date(createdAt.seconds * 1000)
      : new Date(createdAt);
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return "—";
  }
}

async function AdminDashboardContent() {
  const session = await getCurrentSession();
  if (!session) return <p className="text-sm text-[#74796F]">Loading session...</p>;

  const [stats, recent, highPri] = await Promise.all([
    getAdminComplaintStats(),
    getRecentAdminComplaints(6),
    getHighPriorityComplaints(5),
  ]);

  const statusData = Object.entries(stats.statusCounts).map(([name, value]) => ({
    name: name.replace(/_/g, " "),
    value,
  }));
  const categoryData = Object.entries(stats.categoryCounts).map(([name, value]) => ({
    name: name.replace(/_/g, " "),
    value,
  }));
  const monthlyData = stats.monthlyArray.map((d) => ({
    date: d.date,
    count: d.count,
  }));

  const pendingCount = (stats.statusCounts["submitted"] || 0) + (stats.statusCounts["under_review"] || 0);
  const activeCount = (stats.statusCounts["assigned"] || 0) + (stats.statusCounts["in_progress"] || 0);
  const verifyCount = stats.statusCounts["resolution_submitted"] || 0;
  const resolvedCount = (stats.statusCounts["resolved"] || 0) + (stats.statusCounts["closed"] || 0);

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Municipal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E8DF]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-[#536247] bg-[#E9EDE4] px-2 py-0.5 rounded">
              Municipal Operations Console
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#30352D] mt-1">
            Executive Operations Dashboard
          </h1>
          <p className="text-xs text-[#74796F] mt-0.5">
            Logged in as {session.displayName ?? session.email} · Municipal Administrator
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/map">
            <Button
              variant="outline"
              size="sm"
              className="border-[#E5E8DF] text-xs text-[#30352D] gap-1.5 hover:bg-[#F1F3EC]"
            >
              <MapPin className="h-3.5 w-3.5 text-[#788568]" />
              <span>Complaint Map</span>
            </Button>
          </Link>
          <Link href="/admin/complaints">
            <Button
              size="sm"
              className="bg-[#788568] hover:bg-[#536247] text-white text-xs gap-1.5 shadow-none"
            >
              <span>Manage Complaints</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white border border-[#E5E8DF] rounded-md p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#74796F] uppercase tracking-wide">
              Total Filed
            </span>
            <FileText className="h-4 w-4 text-[#788568]" />
          </div>
          <p className="text-2xl font-bold text-[#30352D] mt-1">{stats.total}</p>
          <p className="text-[10px] text-[#74796F] mt-0.5">Cumulative reports</p>
        </div>

        <div className="bg-white border border-[#E5E8DF] rounded-md p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#74796F] uppercase tracking-wide">
              Pending Triage
            </span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-1">{pendingCount}</p>
          <p className="text-[10px] text-[#74796F] mt-0.5">Submitted / Under Review</p>
        </div>

        <div className="bg-white border border-[#E5E8DF] rounded-md p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#74796F] uppercase tracking-wide">
              Active Field Work
            </span>
            <Wrench className="h-4 w-4 text-[#536247]" />
          </div>
          <p className="text-2xl font-bold text-[#536247] mt-1">{activeCount}</p>
          <p className="text-[10px] text-[#74796F] mt-0.5">Assigned to workers</p>
        </div>

        <div className="bg-white border border-[#E5E8DF] rounded-md p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#74796F] uppercase tracking-wide">
              Awaiting Approval
            </span>
            <AlertTriangle className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-700 mt-1">{verifyCount}</p>
          <p className="text-[10px] text-[#74796F] mt-0.5">Evidence submitted</p>
        </div>

        <div className="bg-white border border-[#E5E8DF] rounded-md p-3.5 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#74796F] uppercase tracking-wide">
              Resolved & Closed
            </span>
            <CheckCircle2 className="h-4 w-4 text-[#3E4B37]" />
          </div>
          <p className="text-2xl font-bold text-[#3E4B37] mt-1">{resolvedCount}</p>
          <p className="text-[10px] text-[#74796F] mt-0.5">Verified solutions</p>
        </div>
      </div>

      {/* Analytics Charts */}
      <AdminDashboardCharts
        statusData={statusData}
        categoryData={categoryData}
        monthlyData={monthlyData}
      />

      {/* Data Section: High-Priority Table & Recent Filings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* High-Priority / Urgent Table (2 cols on lg) */}
        <div className="lg:col-span-2 bg-white rounded-md border border-[#E5E8DF] overflow-hidden">
          <div className="p-4 border-b border-[#E5E8DF] flex items-center justify-between bg-[#F8F9F5]">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-600" />
              <h2 className="text-sm font-semibold text-[#30352D]">
                Urgent & High-Priority Matters
              </h2>
            </div>
            <Link
              href="/admin/complaints"
              className="text-xs font-medium text-[#536247] hover:underline"
            >
              Filter table →
            </Link>
          </div>

          {highPri.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#74796F]">
              No urgent complaints flagged in the system.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F8F9F5] text-[#74796F] border-b border-[#E5E8DF]">
                  <tr>
                    <th className="py-2.5 px-3 font-medium">Ticket</th>
                    <th className="py-2.5 px-3 font-medium">Title</th>
                    <th className="py-2.5 px-3 font-medium">Category</th>
                    <th className="py-2.5 px-3 font-medium">Priority</th>
                    <th className="py-2.5 px-3 font-medium">Status</th>
                    <th className="py-2.5 px-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E8DF]">
                  {highPri.map((c) => (
                    <tr key={c.id} className="hover:bg-[#F8F9F5] transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#536247] font-medium">
                        {(c as any).ticketNumber || `#${c.id.slice(0, 6)}`}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[#30352D] max-w-[180px] truncate">
                        {c.title}
                      </td>
                      <td className="py-2.5 px-3 text-[#74796F] capitalize">
                        {c.category?.replace(/_/g, " ")}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] uppercase ${
                            PRIORITY_BADGES[c.priority || "medium"]
                          }`}
                        >
                          {c.priority || "medium"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] capitalize ${
                            STATUS_BADGES[c.status || "submitted"] || "bg-gray-100"
                          }`}
                        >
                          {(c.status || "submitted").replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Link href={`/admin/complaints/${c.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-[11px] px-2 border-[#E5E8DF] text-[#30352D] hover:bg-[#E9EDE4]"
                          >
                            Review
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Filings Feed (1 col on lg) */}
        <div className="bg-white rounded-md border border-[#E5E8DF] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E8DF]">
              <h2 className="text-sm font-semibold text-[#30352D]">Recent Filings</h2>
              <span className="text-[11px] text-[#74796F]">Newest reports</span>
            </div>

            <div className="divide-y divide-[#F1F3EC] mt-1">
              {recent.map((c) => (
                <Link
                  key={c.id}
                  href={`/admin/complaints/${c.id}`}
                  className="py-2.5 flex items-start justify-between gap-2 block group hover:bg-[#F8F9F5] px-1 rounded transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#30352D] group-hover:text-[#536247] truncate">
                      {c.title}
                    </p>
                    <p className="text-[11px] text-[#74796F] capitalize mt-0.5">
                      {c.category?.replace(/_/g, " ")} · {formatTime(c.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 inline-block px-1.5 py-0.5 rounded-full text-[9px] uppercase font-semibold ${
                      STATUS_BADGES[c.status || "submitted"] || "bg-gray-100"
                    }`}
                  >
                    {(c.status || "submitted").replace(/_/g, " ")}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#E5E8DF] mt-2">
            <Link href="/admin/complaints" className="block">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs border-[#E5E8DF] text-[#30352D] hover:bg-[#F1F3EC]"
              >
                View Complete Registry ({stats.total})
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<LoadingState message="Loading admin dashboard..." />}> 
        <AdminDashboardContent />
      </Suspense>
    </DashboardLayout>
  );
}
