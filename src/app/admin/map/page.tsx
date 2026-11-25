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
      <div className="h-[600px] w-full flex items-center justify-center bg-[#ECE9DF] rounded-sm">
        <LoadingState message="Loading interactive map..." />
      </div>
    ),
  }
);

const STATUS_HEX: Record<string, string> = {
  submitted: "#77796F",
  under_review: "#B45309",
  assigned: "#718267",
  in_progress: "#263D30",
  resolution_submitted: "#0369A1",
  resolved: "#1B3A2E",
  closed: "#252820",
  rejected: "#8B342E",
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#DDD9CE]">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#718267] font-medium">
              Spatial Overview
            </p>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1B3A2E] mt-1">
              Municipal Complaint Map
            </h1>
            <p className="text-sm text-[#77796F]">
              Geospatial view of citizen complaints across municipal wards.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#77796F] bg-[#FAF8F2] px-3 py-1.5 rounded-sm border border-[#DDD9CE]">
            <MapPin className="h-4 w-4 text-[#718267]" />
            <span>
              Showing <strong className="text-[#252820]">{geoComplaints.length}</strong> mapped issues
            </span>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-[#FAF8F2] p-3.5 rounded-sm border border-[#DDD9CE] flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#77796F]" />
            <Input
              placeholder="Search title, ticket, or ward..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-sm border-[#DDD9CE] bg-[#F7F5EE]"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 border-[#DDD9CE] bg-[#F7F5EE] text-sm">
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
            <SelectTrigger className="w-48 border-[#DDD9CE] bg-[#F7F5EE] text-sm">
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
        <div className="flex flex-wrap items-center gap-4 px-3 py-2 bg-[#FAF8F2] rounded-sm border border-[#DDD9CE] text-xs text-[#77796F]">
          <span className="font-semibold text-[#252820] flex items-center gap-1">
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
          <div className="lg:col-span-3 bg-[#FAF8F2] p-2 rounded-sm border border-[#DDD9CE] h-[620px]">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <LoadingState message="Loading complaints..." />
              </div>
            ) : error ? (
              <div className="h-full flex items-center justify-center text-[#8B342E] text-sm">
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
          <div className="lg:col-span-1 bg-[#FAF8F2] p-3 rounded-sm border border-[#DDD9CE] flex flex-col h-[620px]">
            <div className="pb-3 border-b border-[#DDD9CE] flex items-center justify-between">
              <h3 className="font-serif text-base font-medium text-[#252820]">
                Filtered Issues ({geoComplaints.length})
              </h3>
              {selectedComplaintId && (
                <button
                  onClick={() => setSelectedComplaintId(null)}
                  className="text-xs text-[#1B3A2E] font-medium hover:underline"
                >
                  Clear focus
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pt-3 pr-1">
              {geoComplaints.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#77796F]">
                  No complaints with location match the current filters.
                </div>
              ) : (
                geoComplaints.map((c) => {
                  const isSelected = c.id === selectedComplaintId;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedComplaintId(c.id)}
                      className={`p-3 rounded-sm border text-left cursor-pointer transition-all ${
                        isSelected
                          ? "border-[#1B3A2E] bg-[#ECE9DF]"
                          : "border-[#DDD9CE] hover:border-[#718267] bg-[#F7F5EE]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[11px] font-mono font-medium text-[#77796F]">
                          {c.ticketNumber}
                        </span>
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: STATUS_HEX[c.status] || "#718267",
                          }}
                        />
                      </div>

                      <h4 className="text-xs font-semibold text-[#252820] line-clamp-1">
                        {c.title}
                      </h4>

                      {c.location?.address && (
                        <p className="text-[11px] text-[#77796F] line-clamp-1 mt-0.5">
                          {c.location.address}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#DDD9CE]/70 text-[10px]">
                        <span className="capitalize text-[#77796F]">
                          {c.categoryLabel || c.category.replace(/_/g, " ")}
                        </span>
                        <Link
                          href={`/admin/complaints/${c.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[#1B3A2E] font-medium hover:underline"
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
