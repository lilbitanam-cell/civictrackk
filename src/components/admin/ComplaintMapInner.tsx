"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { ComplaintDocument } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, MapPin } from "lucide-react";

interface Props {
  complaints: ComplaintDocument[];
  selectedId?: string | null;
  onSelectComplaint?: (c: ComplaintDocument) => void;
}

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

function createCustomIcon(status: string, isSelected: boolean) {
  const color = STATUS_HEX[status] || "#718267";
  const size = isSelected ? 34 : 26;
  const border = isSelected ? "3px solid #000" : "2px solid #FFFFFF";

  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: ${border};
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        transition: transform 0.15s ease;
      ">
        <div style="width: 6px; height: 6px; border-radius: 50%; background-color: white;"></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

const MapContainerAny: any = MapContainer;
const TileLayerAny: any = TileLayer;
const MarkerAny: any = Marker;
const PopupAny: any = Popup;

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 14, { duration: 1.2 });
  }, [center, map]);
  return null;
}

export default function ComplaintMapInner({
  complaints,
  selectedId,
  onSelectComplaint,
}: Props) {
  // Filter complaints that have valid coordinates
  const validComplaints = complaints.filter(
    (c) =>
      c.location &&
      typeof c.location.latitude === "number" &&
      typeof c.location.longitude === "number" &&
      !isNaN(c.location.latitude) &&
      !isNaN(c.location.longitude) &&
      c.location.latitude !== 0 &&
      c.location.longitude !== 0
  );

  const selectedComplaint = validComplaints.find((c) => c.id === selectedId);

  // Default center: selected complaint, or first complaint, or Delhi coords
  const defaultCenter: [number, number] = selectedComplaint
    ? [selectedComplaint.location.latitude, selectedComplaint.location.longitude]
    : validComplaints.length > 0
    ? [validComplaints[0].location.latitude, validComplaints[0].location.longitude]
    : [28.6139, 77.209];

  return (
    <div className="h-full w-full relative">
      <MapContainerAny
        center={defaultCenter}
        zoom={12}
        style={{ height: "100%", width: "100%", minHeight: "500px" }}
        className="rounded-lg z-0"
      >
        <TileLayerAny
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {selectedComplaint && (
          <RecenterMap
            center={[
              selectedComplaint.location.latitude,
              selectedComplaint.location.longitude,
            ]}
          />
        )}

        {validComplaints.map((c) => {
          const isSelected = c.id === selectedId;
          const icon = createCustomIcon(c.status, isSelected);

          return (
            <MarkerAny
              key={c.id}
              position={[c.location.latitude, c.location.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectComplaint?.(c),
              }}
            >
              <PopupAny className="civictrack-popup">
                <div className="p-1 space-y-2 max-w-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-semibold text-[#74796F]">
                      {c.ticketNumber}
                    </span>
                    <span
                      className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded text-white"
                      style={{ backgroundColor: STATUS_HEX[c.status] || "#788568" }}
                    >
                      {c.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  <h4 className="font-semibold text-sm text-[#30352D] line-clamp-2">
                    {c.title}
                  </h4>

                  {c.location.address && (
                    <p className="text-xs text-[#74796F] flex items-center gap-1 line-clamp-1">
                      <MapPin className="h-3 w-3 shrink-0 text-[#788568]" />
                      {c.location.address}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="capitalize text-[#74796F]">
                      {c.categoryLabel || c.category.replace(/_/g, " ")}
                    </span>
                    <span className="capitalize font-medium text-[#536247]">
                      {c.priority} priority
                    </span>
                  </div>

                  <div className="pt-2">
                    <Link href={`/admin/complaints/${c.id}`} className="block">
                      <Button
                        size="sm"
                        className="w-full bg-[#788568] hover:bg-[#536247] text-white text-xs h-7 gap-1"
                      >
                        <span>View Details</span>
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </PopupAny>
            </MarkerAny>
          );
        })}
      </MapContainerAny>
    </div>
  );
}
