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
import { getClientAuth, getClientStorage } from "@/lib/firebase/config";
import { onAuthStateChanged, User } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { createComplaint } from "@/services";
import type { ComplaintCategory, ComplaintPriority } from "@/types/database";
import {
  Camera,
  UploadCloud,
  X,
  MapPin,
  AlertCircle,
  CheckCircle2,
  FileText,
  Info,
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
}

export default function ReportComplaintPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState<FormValues>({
    title: "",
    description: "",
    category: "",
    priority: "",
    address: "",
    city: "",
    landmark: "",
  });
  const [location, setLocation] = useState({ lat: 28.6139, lng: 77.209 });
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getClientAuth();
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
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
    // Validate count
    if (images.length + files.length > 5) {
      setErrors((prev) => ({ ...prev, images: "Max 5 images allowed." }));
      return;
    }
    // Validate size
    const oversized = files.filter((f) => f.size > 2 * 1024 * 1024);
    if (oversized.length > 0) {
      setErrors((prev) => ({
        ...prev,
        images: `Some files exceed 2MB limit: ${oversized.map((f) => f.name).join(", ")}`,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!user) {
      setGlobalError("You must be signed in to report a complaint.");
      return;
    }

    setSubmitting(true);
    setGlobalError(null);

    try {
      // 1. Upload images
      let imageUrls: string[] = [];
      if (images.length > 0) {
        const storage = getClientStorage();
        imageUrls = await Promise.all(
          images.map(async (file) => {
            const path = `complaintImages/${user.uid}/${Date.now()}_${file.name}`;
            const storageRef = ref(storage, path);
            await uploadBytes(storageRef, file);
            return getDownloadURL(storageRef);
          })
        );
      }

      // 2. Find category label
      const categoryObj = CATEGORIES.find((c) => c.value === form.category);

      // 3. Create complaint (direct client write with seamless server API fallback)
      try {
        await createComplaint({
          title: form.title.trim(),
          description: form.description.trim(),
          category: form.category as ComplaintCategory,
          categoryLabel: categoryObj?.label ?? (form.category as string),
          priority: form.priority as ComplaintPriority,
          location: {
            latitude: location.lat,
            longitude: location.lng,
            address: form.address.trim(),
            city: form.city.trim(),
            landmark: form.landmark.trim() || undefined,
          },
          images: imageUrls,
          citizenId: user.uid,
          citizenName: user.displayName ?? user.email ?? "Unknown",
          citizenPhone: undefined,
        });
      } catch (clientCreateErr) {
        console.warn("Direct Firestore creation failed, falling back to server API endpoint:", clientCreateErr);
        const res = await fetch("/api/complaints", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title.trim(),
            description: form.description.trim(),
            category: form.category as ComplaintCategory,
            categoryLabel: categoryObj?.label ?? (form.category as string),
            priority: form.priority as ComplaintPriority,
            location: {
              latitude: location.lat,
              longitude: location.lng,
              address: form.address.trim(),
              city: form.city.trim(),
              landmark: form.landmark.trim() || undefined,
            },
            images: imageUrls,
            citizenId: user.uid,
            citizenName: user.displayName ?? user.email ?? "Unknown",
            citizenPhone: undefined,
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to submit complaint.");
        }
      }

      // 4. Redirect with success
      router.push("/citizen/dashboard?success=complaint_submitted");
    } catch (err: unknown) {
      console.error(err);
      setGlobalError(
        err instanceof Error ? err.message : "Failed to submit complaint. Please try again."
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
        <div className="rounded-md border border-[#D8DDD1] bg-[#F1F3EC] p-4 text-xs text-[#536247] flex items-start gap-3">
          <Info className="h-5 w-5 shrink-0 text-[#788568] mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-[#30352D]">Submission Guidelines</p>
            <p className="leading-relaxed text-[#536247]">
              Please provide precise location details and clear photos of the civic defect. Once submitted, your issue is automatically routed to the relevant municipal division with a trackable ticket number.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {globalError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
              <span>{globalError}</span>
            </div>
          )}

          {/* Section 1: Issue Details */}
          <div className="rounded-md border border-[#E5E8DF] bg-white p-5 space-y-4">
            <div className="border-b border-[#F1F3EC] pb-3">
              <h3 className="text-sm font-semibold text-[#30352D]">1. Grievance Particulars</h3>
              <p className="text-xs text-[#74796F] mt-0.5">Specify the issue type, urgency level, and details.</p>
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
          <div className="rounded-md border border-[#E5E8DF] bg-white p-5 space-y-4">
            <div className="border-b border-[#F1F3EC] pb-3">
              <h3 className="text-sm font-semibold text-[#30352D]">2. Incident Location</h3>
              <p className="text-xs text-[#74796F] mt-0.5">Physical address and geo-coordinates for field verification.</p>
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
                <Label htmlFor="landmark" className="text-xs font-medium text-[#30352D]">
                  Prominent Landmark{" "}
                  <span className="text-xs text-[#74796F] font-normal">(optional)</span>
                </Label>
                <Input
                  id="landmark"
                  placeholder="e.g. Opposite Post Office"
                  value={form.landmark}
                  onChange={(e) => setField("landmark", e.target.value)}
                  className="border-[#E5E8DF] text-sm focus-visible:ring-[#788568]"
                />
              </div>
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
          <div className="rounded-md border border-[#E5E8DF] bg-white p-5 space-y-4">
            <div className="border-b border-[#F1F3EC] pb-3">
              <h3 className="text-sm font-semibold text-[#30352D]">3. Photographic Evidence</h3>
              <p className="text-xs text-[#74796F] mt-0.5">Attach up to 5 clear on-site photographs (Max 2MB per photo).</p>
            </div>

            <div
              className="rounded-md border-2 border-dashed border-[#D8DDD1] p-6 text-center cursor-pointer hover:border-[#788568] hover:bg-[#F8F9F5] transition-all"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageChange}
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="h-10 w-10 rounded-full bg-[#F1F3EC] flex items-center justify-center text-[#788568]">
                  <Camera className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-[#30352D]">
                  Click to select photos or take snapshot
                </p>
                <p className="text-[11px] text-[#74796F]">
                  JPEG, PNG or WebP · Maximum 5 images · Up to 2MB each
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
              className="border-[#E5E8DF] text-[#30352D] hover:bg-[#F1F3EC] text-sm"
              onClick={() => router.back()}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-[#788568] hover:bg-[#536247] text-white text-sm px-6"
            >
              {submitting ? "Submitting Grievance..." : "Submit Grievance Report"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
