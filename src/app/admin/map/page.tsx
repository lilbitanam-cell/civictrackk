"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import AdminLayout from "@/components/admin/AdminLayout";
import { getComplaints } from "@/services/complaints.service";
import { ComplaintDocument, ComplaintStatus, ComplaintCategory } from "@/types";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/shared/loading-state";
import { MapPin, Search, Layers, Filter } from "lucide-react";
import Link from "next/link";

// Dynamic import with SSR disabled for Leaflet
const ComplaintMapInner = dynamic(
  () => import("@/components/admin/ComplaintMapInner"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] w-full flex items-center justify-center bg-[#F1F3EC] rounded-lg">
        <LoadingState message="Loading interactive map..." />
      </div>
    ),
  }
);

const STATUS_HEX: Record<string, string> = {
  submitted: "#9CA3AF",
  under_review: "#D97706",
  assigned: "#788568",
  in_progress: "#536247",
  resolution_submitted: "#2563EB",
  resolved: "#16A34A",
  closed: "#30352D",
  rejected: "#DC2626",
};

export default function AdminComplaintMapPage() {
  const [complaints, setComplaints] = useState<ComplaintDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getComplaints({});
        setComplaints(data);
      } catch (err: any) {
        setError(err.message || "Failed to load complaints");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = complaints.filter((c) => {
    const matchSearch =
      !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
      (c.location?.address &&
        c.location.address.toLowerCase().includes(search.toLowerCase()));

    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    const matchCat = categoryFilter === "all" || c.category === categoryFilter;

    return matchSearch && matchStatus && matchCat;
  });

  const geoComplaints = filtered.filter(
    (c) =>
      c.location?.latitude &&
      c.location?.longitude &&
      c.location.latitude !== 0 &&
      c.location.longitude !== 0
  );

  return (
    <AdminLayout>
      <div className="space-y-4 max-w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold text-[#30352D]">
              Municipal Complaint Map
            </h1>
            <p className="text-sm text-[#74796F]">
              Geospatial view of citizen complaints across municipal wards.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#74796F] bg-white px-3 py-1.5 rounded-md border border-[#E5E8DF]">
            <MapPin className="h-4 w-4 text-[#788568]" />
            <span>
              Showing <strong className="text-[#30352D]">{geoComplaints.length}</strong> mapped issues
            </span>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white p-3.5 rounded-lg border border-[#E5E8DF] flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#74796F]" />
            <Input
              placeholder="Search title, ticket, or ward..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-sm border-[#E5E8DF]"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 border-[#E5E8DF] text-sm">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolution_submitted">Resolution Submitted</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48 border-[#E5E8DF] text-sm">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="roads_potholes">Roads & Potholes</SelectItem>
              <SelectItem value="garbage_collection">Garbage Collection</SelectItem>
              <SelectItem value="water_leakage">Water Leakage</SelectItem>
              <SelectItem value="drainage">Drainage & Sewage</SelectItem>
              <SelectItem value="streetlights">Streetlights & Electrical</SelectItem>
              <SelectItem value="public_infrastructure">Public Infrastructure</SelectItem>
              <SelectItem value="sanitation">Sanitation</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 px-3 py-2 bg-white rounded-md border border-[#E5E8DF] text-xs text-[#74796F]">
          <span className="font-semibold text-[#30352D] flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" /> Legend:
          </span>
          {Object.entries(STATUS_HEX).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full border border-white shadow-xs"
                style={{ backgroundColor: color }}
              />
              <span className="capitalize">{status.replace(/_/g, " ")}</span>
            </div>
          ))}
        </div>

        {/* Map and Side List Container */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-[620px]">
          {/* Map */}
          <div className="lg:col-span-3 bg-white p-2 rounded-lg border border-[#E5E8DF] shadow-xs h-[620px]">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <LoadingState message="Loading complaints..." />
              </div>
            ) : error ? (
              <div className="h-full flex items-center justify-center text-red-600 text-sm">
                {error}
              </div>
            ) : (
              <ComplaintMapInner
                complaints={geoComplaints}
                selectedId={selectedComplaintId}
                onSelectComplaint={(c) => setSelectedComplaintId(c.id)}
              />
            )}
          </div>

          {/* List panel */}
          <div className="lg:col-span-1 bg-white p-3 rounded-lg border border-[#E5E8DF] shadow-xs flex flex-col h-[620px]">
            <div className="pb-3 border-b border-[#E5E8DF] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#30352D]">
                Filtered Issues ({geoComplaints.length})
              </h3>
              {selectedComplaintId && (
                <button
                  onClick={() => setSelectedComplaintId(null)}
                  className="text-xs text-[#788568] hover:underline"
                >
                  Clear focus
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pt-3 pr-1">
              {geoComplaints.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#74796F]">
                  No complaints with location match the current filters.
                </div>
              ) : (
                geoComplaints.map((c) => {
                  const isSelected = c.id === selectedComplaintId;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedComplaintId(c.id)}
                      className={`p-3 rounded-md border text-left cursor-pointer transition-all ${
                        isSelected
                          ? "border-[#536247] bg-[#F1F3EC] shadow-xs"
                          : "border-[#E5E8DF] hover:border-[#B4BBA5] bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[11px] font-mono font-medium text-[#74796F]">
                          {c.ticketNumber}
                        </span>
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: STATUS_HEX[c.status] || "#788568",
                          }}
                        />
                      </div>

                      <h4 className="text-xs font-semibold text-[#30352D] line-clamp-1">
                        {c.title}
                      </h4>

                      {c.location?.address && (
                        <p className="text-[11px] text-[#74796F] line-clamp-1 mt-0.5">
                          {c.location.address}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#F1F3EC] text-[10px]">
                        <span className="capitalize text-[#74796F]">
                          {c.categoryLabel || c.category.replace(/_/g, " ")}
                        </span>
                        <Link
                          href={`/admin/complaints/${c.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[#536247] font-medium hover:underline"
                        >
                          View →
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
