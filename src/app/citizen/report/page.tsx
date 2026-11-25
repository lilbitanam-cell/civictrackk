"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/citizen/DashboardLayout";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getClientAuth,
  isClientFirebaseConfigured,
} from "@/lib/firebase/config";
import {
  STORAGE_LIMITS,
  resolveImageMimeType,
  uploadImageWithFallback,
} from "@/lib/firebase/storage";
import { onAuthStateChanged, User } from "firebase/auth";
import type { ComplaintCategory, ComplaintPriority } from "@/types/database";
import {
  Camera,
  X,
  AlertCircle,
  Info,
  Loader2,
} from "lucide-react";

const MapPicker = dynamic(() => import("@/components/shared/MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full flex items-center justify-center rounded-md border border-[#E5E8DF] bg-[#F8F9F5] text-sm text-[#74796F]">
      Loading map...
    </div>
  ),
});

const CATEGORIES: { value: ComplaintCategory; label: string }[] = [
  { value: "roads_potholes", label: "Roads and Potholes" },
  { value: "garbage_collection", label: "Garbage" },
  { value: "water_leakage", label: "Water Leakage" },
  { value: "drainage", label: "Drainage" },
  { value: "streetlights", label: "Streetlights" },
  { value: "public_infrastructure", label: "Public Infrastructure" },
  { value: "sanitation", label: "Sanitation" },
  { value: "other", label: "Other" },
];

const PRIORITIES: { value: ComplaintPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const MAX_REPORT_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB (auto-compressed before upload)

interface FormErrors {
  title?: string;
  description?: string;
  category?: string;
  priority?: string;
  address?: string;
  city?: string;
  images?: string;
}

interface FormValues {
  title: string;
  description: string;
  category: ComplaintCategory | "";
  priority: ComplaintPriority | "";
  address: string;
  city: string;
  landmark: string;
  phone: string;
}

interface SessionUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: string;
}

export default function ReportComplaintPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const errorBannerRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [form, setForm] = useState<FormValues>({
    title: "",
    description: "",
    category: "",
    priority: "",
    address: "",
    city: "",
    landmark: "",
    phone: "",
  });
  const [location, setLocation] = useState({ lat: 28.6139, lng: 77.209 });
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitStage, setSubmitStage] = useState<string>("Submitting Grievance...");
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    // Pre-fill category if linked from homepage category cards
    try {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get("category") as ComplaintCategory | null;
      if (cat && CATEGORIES.some((c) => c.value === cat)) {
        setForm((prev) => (prev.category ? prev : { ...prev, category: cat }));
      }
    } catch {}

    // 1. Verify server session cookie (works for live Firebase & devRole mode)
    fetch("/api/auth/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        if (data?.authenticated && data.user) {
          setSessionUser(data.user);
        }
      })
      .catch(() => {
        // Non-fatal; Firebase client auth may still resolve
      })
      .finally(() => {
        if (active) setAuthChecked(true);
      });

    // 2. Also listen to Firebase Client Auth if configured
    let unsub: (() => void) | undefined;
    if (isClientFirebaseConfigured) {
      try {
        const auth = getClientAuth();
        unsub = onAuthStateChanged(auth, (u) => {
          if (active) setUser(u);
        });
      } catch (err) {
        console.warn("Firebase client auth listener error:", err);
      }
    }

    return () => {
      active = false;
      if (unsub) unsub();
    };
  }, []);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!form.title.trim()) errs.title = "Title is required.";
    if (!form.description.trim()) errs.description = "Description is required.";
    if (!form.category) errs.category = "Please select a category.";
    if (!form.priority) errs.priority = "Please select a priority.";
    if (!form.address.trim()) errs.address = "Address is required.";
    if (!form.city.trim()) errs.city = "City is required.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // Reset input so re-selecting the same file works after removing/fixing
    e.target.value = "";

    if (files.length === 0) return;

    if (images.length + files.length > 5) {
      setErrors((prev) => ({ ...prev, images: "Maximum 5 images allowed." }));
      return;
    }

    const unsupported = files.filter(
      (f) => !["image/jpeg", "image/png", "image/webp"].includes(resolveImageMimeType(f))
    );
    if (unsupported.length > 0) {
      setErrors((prev) => ({
        ...prev,
        images: `Unsupported format (${unsupported.map((f) => f.name).join(", ")}). Please upload JPG, PNG, or WebP images only.`,
      }));
      return;
    }

    const oversized = files.filter((f) => f.size > MAX_REPORT_IMAGE_BYTES);
    if (oversized.length > 0) {
      setErrors((prev) => ({
        ...prev,
        images: `Some files exceed the 5MB limit: ${oversized.map((f) => f.name).join(", ")}`,
      }));
      return;
    }

    setErrors((prev) => ({ ...prev, images: undefined }));
    setImages((prev) => [...prev, ...files]);
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviewUrls((prev) => [...prev, ...urls]);
  };

  const removeImage = (idx: number) => {
    URL.revokeObjectURL(previewUrls[idx]);
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleMapChange = useCallback(
    (loc: { lat: number; lng: number }) => setLocation(loc),
    []
  );

  const showError = (msg: string) => {
    setGlobalError(msg);
    requestAnimationFrame(() => {
      errorBannerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    if (!validate()) {
      showError("Please complete all required fields highlighted below before submitting.");
      return;
    }

    const activeUid = sessionUser?.uid || user?.uid;
    if (!activeUid) {
      showError(
        authChecked
          ? "Your session has expired. Please sign in again to submit a grievance."
          : "Verifying your session, please wait a moment and try again."
      );
      return;
    }

    setSubmitting(true);

    try {
      // 1. Upload images (Client Storage with automatic /api/upload fallback)
      let imageUrls: string[] = [];
      if (images.length > 0) {
        setSubmitStage(`Uploading ${images.length} photo${images.length > 1 ? "s" : ""}...`);
        imageUrls = await Promise.all(
          images.map((file) => uploadImageWithFallback(file, "complaintImages"))
        );
      }

      // 2. Build sanitized payload (no undefined values)
      setSubmitStage("Submitting Grievance...");
      const categoryObj = CATEGORIES.find((c) => c.value === form.category);
      const trimmedLandmark = form.landmark.trim();
      const locationPayload: {
        latitude: number;
        longitude: number;
        address: string;
        city: string;
        landmark?: string;
      } = {
        latitude: location.lat,
        longitude: location.lng,
        address: form.address.trim(),
        city: form.city.trim(),
      };
      if (trimmedLandmark) {
        locationPayload.landmark = trimmedLandmark;
      }

      // 3. Submit via server API route (handles Firestore write, history log, and admin notifications)
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          category: form.category as ComplaintCategory,
          categoryLabel: categoryObj?.label ?? (form.category as string),
          priority: form.priority as ComplaintPriority,
          location: locationPayload,
          images: imageUrls,
          citizenId: activeUid,
          citizenName:
            sessionUser?.displayName ||
            user?.displayName ||
            sessionUser?.email ||
            user?.email ||
            "Citizen Resident",
          ...(form.phone.trim() ? { citizenPhone: form.phone.trim() } : {}),
        }),
      });

      const rawText = await res.text();
      let data: { error?: string; ticketNumber?: string; complaintId?: string } = {};
      if (rawText) {
        try {
          data = JSON.parse(rawText);
        } catch {
          throw new Error(
            res.ok
              ? "Server returned an unexpected response."
              : `Submission failed (HTTP ${res.status}). Please try again.`
          );
        }
      }

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Your session has expired. Please sign in again and retry.");
        }
        throw new Error(data.error || `Failed to submit complaint (HTTP ${res.status}).`);
      }

      // 4. Redirect to dashboard with ticket confirmation and refresh server data
      const ticketParam = data.ticketNumber
        ? `&ticket=${encodeURIComponent(data.ticketNumber)}`
        : "";
      router.push(`/citizen/dashboard?success=complaint_submitted${ticketParam}`);
      router.refresh();
    } catch (err: unknown) {
      console.error("Complaint submission error:", err);
      showError(
        err instanceof Error
          ? err.message
          : "Failed to submit complaint. Please try again."
      );
      setSubmitting(false);
    }
  };

  const setField = (field: keyof FormValues, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <PageHeading
            title="Register Civic Grievance"
            description="Submit an official grievance report for municipal inspection and departmental resolution."
          />
        </div>

        {/* Municipal Guidance Banner */}
        <div className="rounded-sm border border-[#DDD9CE] bg-[#ECE9DF]/65 p-4 text-xs text-[#263D30] flex items-start gap-3">
          <Info className="h-5 w-5 shrink-0 text-[#1B3A2E] mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-[#1B3A2E]">Submission Guidelines</p>
            <p className="leading-relaxed text-[#77796F]">
              Please provide clear location details and on-site photographs of the civic defect. Once submitted, your issue is routed to the relevant municipal division with a trackable ticket reference.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {globalError && (
            <div
              ref={errorBannerRef}
              className="rounded-sm border border-[#E4C9C6] bg-[#F4E8E7] p-4 text-sm text-[#8B342E] flex items-start gap-2"
            >
              <AlertCircle className="h-5 w-5 shrink-0 text-[#8B342E] mt-0.5" />
              <span>{globalError}</span>
            </div>
          )}

          {/* Section 1: Issue Details */}
          <div className="rounded-sm border border-[#DDD9CE] bg-[#FAF8F2] p-5 sm:p-6 space-y-4">
            <div className="border-b border-[#DDD9CE] pb-3">
              <h3 className="font-serif text-lg font-semibold text-[#1B3A2E]">1. Grievance Particulars</h3>
              <p className="text-xs text-[#77796F] mt-0.5">Specify the issue category, urgency level, and details.</p>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-medium text-[#30352D]">
                Grievance Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g. Major pothole causing traffic slowdown near bus depot"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                className="border-[#E5E8DF] text-sm focus-visible:ring-[#788568]"
              />
              {errors.title && (
                <p className="text-xs text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Category + Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[#30352D]">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setField("category", v)}
                >
                  <SelectTrigger className="border-[#E5E8DF] text-sm focus:ring-[#788568]">
                    <SelectValue placeholder="Select municipal category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-xs text-red-600">{errors.category}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[#30352D]">
                  Priority Urgency <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setField("priority", v)}
                >
                  <SelectTrigger className="border-[#E5E8DF] text-sm focus:ring-[#788568]">
                    <SelectValue placeholder="Select urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.priority && (
                  <p className="text-xs text-red-600">{errors.priority}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-medium text-[#30352D]">
                Detailed Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe the severity, duration, and specific nature of the problem..."
                rows={4}
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                className="border-[#E5E8DF] resize-none text-sm focus-visible:ring-[#788568]"
              />
              {errors.description && (
                <p className="text-xs text-red-600">{errors.description}</p>
              )}
            </div>
          </div>

          {/* Section 2: Location */}
          <div className="rounded-sm border border-[#DDD9CE] bg-[#FAF8F2] p-5 sm:p-6 space-y-4">
            <div className="border-b border-[#DDD9CE] pb-3">
              <h3 className="font-serif text-lg font-semibold text-[#1B3A2E]">2. Incident Location &amp; Contact</h3>
              <p className="text-xs text-[#77796F] mt-0.5">Physical address, map coordinates, and optional callback number for field inspection.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-xs font-medium text-[#30352D]">
                Street Address / Ward <span className="text-red-500">*</span>
              </Label>
              <Input
                id="address"
                placeholder="e.g. 14 Patel Marg, Ward 8, Sector 12"
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
                className="border-[#E5E8DF] text-sm focus-visible:ring-[#788568]"
              />
              {errors.address && (
                <p className="text-xs text-red-600">{errors.address}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-xs font-medium text-[#30352D]">
                  City / Town <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="city"
                  placeholder="e.g. New Delhi"
                  value={form.city}
                  onChange={(e) => setField("city", e.target.value)}
                  className="border-[#E5E8DF] text-sm focus-visible:ring-[#788568]"
                />
                {errors.city && (
                  <p className="text-xs text-red-600">{errors.city}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="landmark" className="text-xs font-medium text-[#252820]">
                  Prominent Landmark{" "}
                  <span className="text-xs text-[#77796F] font-normal">(optional)</span>
                </Label>
                <Input
                  id="landmark"
                  placeholder="e.g. Opposite Post Office"
                  value={form.landmark}
                  onChange={(e) => setField("landmark", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-medium text-[#252820]">
                Contact Mobile Number{" "}
                <span className="text-xs text-[#77796F] font-normal">(optional, for field team coordination)</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="e.g. +91 98765 43210"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
              />
            </div>

            {/* Map */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs text-[#74796F]">
                <span className="font-medium text-[#30352D]">Pinpoint Location on Map</span>
                <span>Coordinates: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}</span>
              </div>
              <div className="rounded-md overflow-hidden border border-[#E5E8DF]">
                <MapPicker onChange={handleMapChange} />
              </div>
              <p className="text-[11px] text-[#74796F]">
                Click anywhere on the map to place the accurate pin.
              </p>
            </div>
          </div>

          {/* Section 3: Photographic Evidence */}
          <div className="rounded-sm border border-[#DDD9CE] bg-[#FAF8F2] p-5 sm:p-6 space-y-4">
            <div className="border-b border-[#DDD9CE] pb-3">
              <h3 className="font-serif text-lg font-semibold text-[#1B3A2E]">3. Photographic Evidence</h3>
              <p className="text-xs text-[#77796F] mt-0.5">Attach up to 5 clear on-site photographs (JPG, PNG, WebP · Max 5MB per photo).</p>
            </div>

            <div
              className="rounded-sm border border-dashed border-[#718267] bg-[#F7F5EE] p-6 text-center cursor-pointer hover:bg-[#ECE9DF]/60 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handleImageChange}
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="h-10 w-10 rounded-sm bg-[#ECE9DF] flex items-center justify-center text-[#1B3A2E]">
                  <Camera className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-[#252820]">
                  Click to select photos or take snapshot
                </p>
                <p className="text-[11px] text-[#77796F]">
                  JPEG, PNG or WebP · Maximum 5 images · Up to 5MB each
                </p>
              </div>
            </div>

            {errors.images && (
              <p className="text-xs text-red-600">{errors.images}</p>
            )}

            {previewUrls.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-[#30352D]">Selected Photos ({previewUrls.length}/5):</p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                  {previewUrls.map((url, i) => (
                    <div key={i} className="relative group rounded-md overflow-hidden border border-[#E5E8DF] bg-[#F1F3EC]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Evidence ${i + 1}`}
                        className="h-20 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(i);
                        }}
                        className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-600 text-white flex items-center justify-center opacity-85 hover:opacity-100 transition-opacity"
                        title="Remove photo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="px-6"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {submitStage}
                </span>
              ) : (
                "Submit Grievance Report"
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
