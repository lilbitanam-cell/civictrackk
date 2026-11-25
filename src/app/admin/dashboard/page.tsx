import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
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
  submitted: "bg-[#ECE9DF] text-[#252820] border border-[#DDD9CE]",
  under_review: "bg-amber-50/80 text-amber-900 border border-amber-200",
  assigned: "bg-[#ECE9DF] text-[#1B3A2E] border border-[#B4BBA5]",
  in_progress: "bg-[#718267] text-white",
  resolution_submitted: "bg-sky-50/80 text-sky-900 border border-sky-200 font-semibold",
  resolved: "bg-[#1B3A2E] text-[#F7F5EE]",
  closed: "bg-[#252820] text-[#F7F5EE]",
  rejected: "border border-[#E5C9C6] text-[#8B342E] bg-[#FAF0EE]",
};

const PRIORITY_BADGES: Record<string, string> = {
  low: "bg-[#F7F5EE] text-[#77796F] border border-[#DDD9CE]",
  medium: "bg-amber-50/80 text-amber-900 border border-amber-200",
  high: "bg-orange-50/80 text-orange-900 border border-orange-200 font-medium",
  urgent: "bg-[#FAF0EE] text-[#8B342E] border border-[#E5C9C6] font-semibold",
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
  if (!session || session.role !== "admin") {
    redirect("/unauthorized?reason=admin_required");
  }

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#DDD9CE]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase font-medium tracking-[0.14em] text-[#718267]">
              Municipal Operations Console
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[#1B3A2E] mt-1">
            Executive Operations Dashboard
          </h1>
          <p className="text-xs text-[#77796F] mt-1">
            Logged in as {session.displayName ?? session.email} · Municipal Administrator
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/map">
            <Button
              variant="outline"
              size="sm"
              className="border-[#DDD9CE] text-xs text-[#252820] gap-1.5 hover:bg-[#ECE9DF]"
            >
              <MapPin className="h-3.5 w-3.5 text-[#718267]" />
              <span>Complaint Map</span>
            </Button>
          </Link>
          <Link href="/admin/complaints">
            <Button
              size="sm"
              className="bg-[#1B3A2E] hover:bg-[#263D30] text-[#F7F5EE] text-xs gap-1.5 shadow-none"
            >
              <span>Manage Complaints</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-[#FAF8F2] border border-[#DDD9CE] rounded-sm p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#77796F] uppercase tracking-wider">
              Total Filed
            </span>
            <FileText className="h-4 w-4 text-[#718267]" />
          </div>
          <p className="font-serif text-2xl font-semibold text-[#252820] mt-1">{stats.total}</p>
          <p className="text-[10px] text-[#77796F] mt-0.5">Cumulative reports</p>
        </div>

        <div className="bg-[#FAF8F2] border border-[#DDD9CE] rounded-sm p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#77796F] uppercase tracking-wider">
              Pending Triage
            </span>
            <Clock className="h-4 w-4 text-amber-700" />
          </div>
          <p className="font-serif text-2xl font-semibold text-amber-800 mt-1">{pendingCount}</p>
          <p className="text-[10px] text-[#77796F] mt-0.5">Submitted / Under Review</p>
        </div>

        <div className="bg-[#FAF8F2] border border-[#DDD9CE] rounded-sm p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#77796F] uppercase tracking-wider">
              Active Field Work
            </span>
            <Wrench className="h-4 w-4 text-[#1B3A2E]" />
          </div>
          <p className="font-serif text-2xl font-semibold text-[#1B3A2E] mt-1">{activeCount}</p>
          <p className="text-[10px] text-[#77796F] mt-0.5">Assigned to workers</p>
        </div>

        <div className="bg-[#FAF8F2] border border-[#DDD9CE] rounded-sm p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#77796F] uppercase tracking-wider">
              Awaiting Approval
            </span>
            <AlertTriangle className="h-4 w-4 text-sky-700" />
          </div>
          <p className="font-serif text-2xl font-semibold text-sky-800 mt-1">{verifyCount}</p>
          <p className="text-[10px] text-[#77796F] mt-0.5">Evidence submitted</p>
        </div>

        <div className="bg-[#FAF8F2] border border-[#DDD9CE] rounded-sm p-4 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#77796F] uppercase tracking-wider">
              Resolved & Closed
            </span>
            <CheckCircle2 className="h-4 w-4 text-[#2D5A3F]" />
          </div>
          <p className="font-serif text-2xl font-semibold text-[#2D5A3F] mt-1">{resolvedCount}</p>
          <p className="text-[10px] text-[#77796F] mt-0.5">Verified solutions</p>
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
        <div className="lg:col-span-2 bg-[#FAF8F2] rounded-sm border border-[#DDD9CE] overflow-hidden">
          <div className="p-4 border-b border-[#DDD9CE] flex items-center justify-between bg-[#ECE9DF]/60">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-[#8B342E]" />
              <h2 className="font-serif text-base font-medium text-[#252820]">
                Urgent & High-Priority Matters
              </h2>
            </div>
            <Link
              href="/admin/complaints"
              className="text-xs font-medium text-[#1B3A2E] hover:underline"
            >
              Filter table →
            </Link>
          </div>

          {highPri.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#77796F]">
              No urgent complaints flagged in the system.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#ECE9DF]/40 text-[#77796F] border-b border-[#DDD9CE]">
                  <tr>
                    <th className="py-2.5 px-3 font-medium">Ticket</th>
                    <th className="py-2.5 px-3 font-medium">Title</th>
                    <th className="py-2.5 px-3 font-medium">Category</th>
                    <th className="py-2.5 px-3 font-medium">Priority</th>
                    <th className="py-2.5 px-3 font-medium">Status</th>
                    <th className="py-2.5 px-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDD9CE]">
                  {highPri.map((c) => (
                    <tr key={c.id} className="hover:bg-[#ECE9DF]/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#1B3A2E] font-medium">
                        {(c as any).ticketNumber || `#${c.id.slice(0, 6)}`}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[#252820] max-w-[180px] truncate">
                        {c.title}
                      </td>
                      <td className="py-2.5 px-3 text-[#77796F] capitalize">
                        {c.category?.replace(/_/g, " ")}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded-sm text-[10px] uppercase ${
                            PRIORITY_BADGES[c.priority || "medium"]
                          }`}
                        >
                          {c.priority || "medium"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] capitalize ${
                            STATUS_BADGES[c.status || "submitted"] || "bg-[#ECE9DF]"
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
                            className="h-6 text-[11px] px-2 border-[#DDD9CE] text-[#252820] hover:bg-[#ECE9DF]"
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
        <div className="bg-[#FAF8F2] rounded-sm border border-[#DDD9CE] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#DDD9CE]">
              <h2 className="font-serif text-base font-medium text-[#252820]">Recent Filings</h2>
              <span className="text-[11px] text-[#77796F]">Newest reports</span>
            </div>

            <div className="divide-y divide-[#DDD9CE]/70 mt-1">
              {recent.map((c) => (
                <Link
                  key={c.id}
                  href={`/admin/complaints/${c.id}`}
                  className="py-2.5 flex items-start justify-between gap-2 block group hover:bg-[#ECE9DF]/50 px-1.5 rounded-sm transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#252820] group-hover:text-[#1B3A2E] truncate">
                      {c.title}
                    </p>
                    <p className="text-[11px] text-[#77796F] capitalize mt-0.5">
                      {c.category?.replace(/_/g, " ")} · {formatTime(c.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 inline-block px-1.5 py-0.5 rounded-full text-[9px] uppercase font-semibold ${
                      STATUS_BADGES[c.status || "submitted"] || "bg-[#ECE9DF]"
                    }`}
                  >
                    {(c.status || "submitted").replace(/_/g, " ")}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#DDD9CE] mt-2">
            <Link href="/admin/complaints" className="block">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs border-[#DDD9CE] text-[#252820] hover:bg-[#ECE9DF]"
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
