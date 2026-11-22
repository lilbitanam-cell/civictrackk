"use client";

import { useState, useEffect, useMemo } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { getComplaints } from "@/services/complaints.service";
import { getAllDepartments } from "@/services/departments.service";
import { ComplaintDocument, DepartmentDocument } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingState } from "@/components/shared/loading-state";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Download,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  TrendingUp,
} from "lucide-react";
import { format, subDays, isAfter, isBefore, parseISO } from "date-fns";

const SAGE_COLORS = [
  "#536247",
  "#788568",
  "#96A284",
  "#B4BBA5",
  "#6A7B5A",
  "#3E4B37",
  "#8C967A",
  "#30352D",
];

function AnalyticsContent() {
  const [complaints, setComplaints] = useState<ComplaintDocument[]>([]);
  const [departments, setDepartments] = useState<DepartmentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  // Date filters
  const [dateRange, setDateRange] = useState<string>("30"); // 7, 30, 90, all, custom
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [complaintsData, deptsData] = await Promise.all([
          getComplaints({}),
          getAllDepartments(),
        ]);
        setComplaints(complaintsData);
        setDepartments(deptsData);
      } catch (err: any) {
        setError(err.message || "Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Helper to extract JS Date from Firestore timestamp or string
  const toDate = (timestamp: any): Date | null => {
    if (!timestamp) return null;
    if (typeof timestamp === "string") return parseISO(timestamp);
    if ("toDate" in timestamp && typeof timestamp.toDate === "function") {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  };

  // Filter complaints by date range
  const filteredComplaints = useMemo(() => {
    const now = currentDate || new Date(0);
    return complaints.filter((c) => {
      const created = toDate(c.createdAt);
      if (!created) return true;

      if (dateRange === "7") {
        return isAfter(created, subDays(now, 7));
      } else if (dateRange === "30") {
        return isAfter(created, subDays(now, 30));
      } else if (dateRange === "90") {
        return isAfter(created, subDays(now, 90));
      } else if (dateRange === "custom") {
        if (customStartDate && isBefore(created, parseISO(customStartDate))) {
          return false;
        }
        if (customEndDate && isAfter(created, parseISO(customEndDate))) {
          return false;
        }
        return true;
      }
      return true;
    });
  }, [complaints, dateRange, customStartDate, customEndDate]);

  // Overall Statistics
  const stats = useMemo(() => {
    const total = filteredComplaints.length;
    const resolved = filteredComplaints.filter(
      (c) => c.status === "resolved" || c.status === "closed"
    ).length;
    const inProgress = filteredComplaints.filter(
      (c) => c.status === "in_progress" || c.status === "assigned"
    ).length;
    const pending = filteredComplaints.filter(
      (c) => c.status === "submitted" || c.status === "under_review"
    ).length;

    // Average resolution time (in hours)
    let totalResolutionHours = 0;
    let resolvedWithDatesCount = 0;

    filteredComplaints.forEach((c) => {
      if (c.status === "resolved" || c.status === "closed") {
        const created = toDate(c.createdAt);
        const resDate = toDate(c.resolvedAt);
        if (created && resDate) {
          const diffMs = resDate.getTime() - created.getTime();
          if (diffMs > 0) {
            totalResolutionHours += diffMs / (1000 * 60 * 60);
            resolvedWithDatesCount++;
          }
        }
      }
    });

    const avgResolutionHours =
      resolvedWithDatesCount > 0
        ? Math.round((totalResolutionHours / resolvedWithDatesCount) * 10) / 10
        : 0;

    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    return {
      total,
      resolved,
      inProgress,
      pending,
      avgResolutionHours,
      resolutionRate,
    };
  }, [filteredComplaints]);

  // Status Distribution Data
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredComplaints.forEach((c) => {
      const s = c.status.replace(/_/g, " ");
      counts[s] = (counts[s] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [filteredComplaints]);

  // Category Distribution Data
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredComplaints.forEach((c) => {
      const cat = c.categoryLabel || c.category.replace(/_/g, " ");
      counts[cat] = (counts[cat] || 0) + 1;
    });

    return Object.entries(counts).map(([name, count]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count,
    }));
  }, [filteredComplaints]);

  // Department Performance Data
  const departmentPerformance = useMemo(() => {
    const deptStats: Record<
      string,
      { total: number; resolved: number; inProgress: number }
    > = {};

    // Initialize with known departments
    departments.forEach((d) => {
      deptStats[d.name] = { total: 0, resolved: 0, inProgress: 0 };
    });

    filteredComplaints.forEach((c) => {
      const dName = c.departmentName || "Unassigned";
      if (!deptStats[dName]) {
        deptStats[dName] = { total: 0, resolved: 0, inProgress: 0 };
      }
      deptStats[dName].total += 1;
      if (c.status === "resolved" || c.status === "closed") {
        deptStats[dName].resolved += 1;
      } else if (c.status === "in_progress" || c.status === "assigned") {
        deptStats[dName].inProgress += 1;
      }
    });

    return Object.entries(deptStats).map(([name, d]) => ({
      department: name,
      total: d.total,
      resolved: d.resolved,
      inProgress: d.inProgress,
      rate: d.total > 0 ? Math.round((d.resolved / d.total) * 100) : 0,
    }));
  }, [filteredComplaints, departments]);

  // CSV Export Handler
  const handleExportCSV = () => {
    if (filteredComplaints.length === 0) return;

    const headers = [
      "Ticket Number",
      "Title",
      "Category",
      "Department",
      "Status",
      "Priority",
      "Citizen Name",
      "Citizen Phone",
      "Address",
      "Created At",
      "Resolved At",
    ];

    const rows = filteredComplaints.map((c) => {
      const created = toDate(c.createdAt);
      const resolved = toDate(c.resolvedAt);

      return [
        `"${c.ticketNumber || ""}"`,
        `"${(c.title || "").replace(/"/g, '""')}"`,
        `"${c.category || ""}"`,
        `"${c.departmentName || "Unassigned"}"`,
        `"${c.status || ""}"`,
        `"${c.priority || ""}"`,
        `"${(c.citizenName || "").replace(/"/g, '""')}"`,
        `"${c.citizenPhone || ""}"`,
        `"${(c.location?.address || "").replace(/"/g, '""')}"`,
        `"${created ? format(created, "yyyy-MM-dd HH:mm:ss") : ""}"`,
        `"${resolved ? format(resolved, "yyyy-MM-dd HH:mm:ss") : ""}"`,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `civictrack_report_${format(new Date(), "yyyyMMdd_HHmm")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#30352D]">
              Municipal Analytics & Reports
            </h1>
            <p className="text-sm text-[#74796F]">
              Real-time performance analytics calculated directly from database records.
            </p>
          </div>
          <Button
            onClick={handleExportCSV}
            disabled={filteredComplaints.length === 0}
            className="bg-[#788568] hover:bg-[#536247] text-white text-sm gap-2 shrink-0"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </Button>
        </div>

        {/* Date Filter Bar */}
        <div className="bg-white p-4 rounded-lg border border-[#E5E8DF] shadow-xs flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-[#30352D]">
            <Calendar className="h-4 w-4 text-[#788568]" />
            <span>Time Range:</span>
          </div>

          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40 border-[#E5E8DF] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {dateRange === "custom" && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="text-xs border-[#E5E8DF] w-36"
              />
              <span className="text-xs text-[#74796F]">to</span>
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="text-xs border-[#E5E8DF] w-36"
              />
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingState message="Calculating analytics..." />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 border border-red-300 rounded-md">
            {error}
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-[#E5E8DF] bg-white">
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-medium text-[#74796F]">
                    Total Complaints
                  </CardTitle>
                  <FileText className="h-4 w-4 text-[#788568]" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-bold text-[#30352D]">
                    {stats.total}
                  </div>
                  <p className="text-[11px] text-[#74796F] mt-1">
                    Recorded in selected period
                  </p>
                </CardContent>
              </Card>

              <Card className="border-[#E5E8DF] bg-white">
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-medium text-[#74796F]">
                    Resolution Rate
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-[#536247]" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-bold text-[#536247]">
                    {stats.resolutionRate}%
                  </div>
                  <p className="text-[11px] text-[#74796F] mt-1">
                    {stats.resolved} of {stats.total} resolved
                  </p>
                </CardContent>
              </Card>

              <Card className="border-[#E5E8DF] bg-white">
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-medium text-[#74796F]">
                    Avg. Resolution Time
                  </CardTitle>
                  <Clock className="h-4 w-4 text-[#788568]" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-bold text-[#30352D]">
                    {stats.avgResolutionHours > 0
                      ? `${stats.avgResolutionHours} hrs`
                      : "N/A"}
                  </div>
                  <p className="text-[11px] text-[#74796F] mt-1">
                    From submission to resolution
                  </p>
                </CardContent>
              </Card>

              <Card className="border-[#E5E8DF] bg-white">
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-medium text-[#74796F]">
                    Active Work Orders
                  </CardTitle>
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-bold text-amber-600">
                    {stats.inProgress}
                  </div>
                  <p className="text-[11px] text-[#74796F] mt-1">
                    Assigned or In Progress
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status Breakdown Pie */}
              <Card className="border-[#E5E8DF] bg-white">
                <CardHeader className="p-4 border-b border-[#E5E8DF]">
                  <CardTitle className="text-sm font-semibold text-[#30352D]">
                    Complaint Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 h-72">
                  {statusData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-[#74796F]">
                      No data for selected period
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={SAGE_COLORS[index % SAGE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: "11px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Category Bar Chart */}
              <Card className="border-[#E5E8DF] bg-white">
                <CardHeader className="p-4 border-b border-[#E5E8DF]">
                  <CardTitle className="text-sm font-semibold text-[#30352D]">
                    Issues by Civic Category
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 h-72">
                  {categoryData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-[#74796F]">
                      No data for selected period
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData} layout="vertical">
                        <XAxis type="number" fontSize={11} stroke="#74796F" />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={120}
                          fontSize={11}
                          stroke="#74796F"
                        />
                        <Tooltip />
                        <Bar dataKey="count" fill="#788568" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Department Performance Table */}
            <Card className="border-[#E5E8DF] bg-white">
              <CardHeader className="p-4 border-b border-[#E5E8DF]">
                <CardTitle className="text-sm font-semibold text-[#30352D]">
                  Department Performance & Resolution Rate
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-[#F8F9F5] text-xs text-[#74796F] border-b border-[#E5E8DF]">
                      <tr>
                        <th className="py-3 px-4 font-medium">Department</th>
                        <th className="py-3 px-4 font-medium text-center">
                          Total Assigned
                        </th>
                        <th className="py-3 px-4 font-medium text-center">
                          In Progress
                        </th>
                        <th className="py-3 px-4 font-medium text-center">
                          Resolved
                        </th>
                        <th className="py-3 px-4 font-medium text-right">
                          Resolution Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E8DF]">
                      {departmentPerformance.map((dept) => (
                        <tr
                          key={dept.department}
                          className="hover:bg-[#F8F9F5] transition-colors"
                        >
                          <td className="py-3 px-4 font-medium text-[#30352D]">
                            {dept.department}
                          </td>
                          <td className="py-3 px-4 text-center text-[#74796F]">
                            {dept.total}
                          </td>
                          <td className="py-3 px-4 text-center text-amber-700 font-medium">
                            {dept.inProgress}
                          </td>
                          <td className="py-3 px-4 text-center text-[#536247] font-medium">
                            {dept.resolved}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                                dept.rate >= 75
                                  ? "bg-[#E9EDE4] text-[#3E4B37]"
                                  : dept.rate >= 40
                                  ? "bg-amber-50 text-amber-800"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {dept.rate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default function AdminAnalyticsPage() {
  return <AnalyticsContent />;
}
