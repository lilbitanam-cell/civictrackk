"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WorkerTaskDocument } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  STORAGE_LIMITS,
  resolveImageMimeType,
  uploadImageWithFallback,
} from "@/lib/firebase/storage";
import { Camera, CheckCircle2, Loader2 } from "lucide-react";

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const text = await res.text();
    if (!text) return fallback;
    const data = JSON.parse(text);
    return data?.error || fallback;
  } catch {
    return `${fallback} (HTTP ${res.status})`;
  }
}

export default function WorkerTaskActions({ task }: { task: WorkerTaskDocument }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  const patchTask = async (body: Record<string, unknown>) => {
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, "Request failed"));
    }
  };

  const act = async (fn: () => Promise<void>, successMsg: string) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      setMsg({ type: "success", text: successMsg });
      router.refresh();
    } catch (e: unknown) {
      setMsg({
        type: "error",
        text: e instanceof Error ? e.message : "Failed to complete action.",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []).slice(0, 5);
    e.target.value = "";
    if (selected.length === 0) return;

    const invalidType = selected.find(
      (f) => !["image/jpeg", "image/png", "image/webp"].includes(resolveImageMimeType(f))
    );
    if (invalidType) {
      setMsg({
        type: "error",
        text: `Unsupported file format (${invalidType.name}). Please upload JPG, PNG, or WebP images.`,
      });
      return;
    }

    const oversized = selected.find(
      (f) => f.size > STORAGE_LIMITS.MAX_FILE_SIZE_BYTES
    );
    if (oversized) {
      setMsg({
        type: "error",
        text: `File "${oversized.name}" exceeds the 5MB limit.`,
      });
      return;
    }

    previews.forEach((url) => URL.revokeObjectURL(url));
    setMsg(null);
    setFiles(selected);
    setPreviews(selected.map((f) => URL.createObjectURL(f)));
  };

  const uploadImages = async () => {
    return Promise.all(
      files.map((file) => uploadImageWithFallback(file, "taskEvidence", task.id))
    );
  };

  if (task.status === "completed") {
    return (
      <div className="bg-[#ECE9DF] border border-[#718267] rounded-sm p-5 text-sm text-[#1B3A2E] flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-[#1B3A2E] mt-0.5" />
        <div>
          <p className="font-serif text-base font-medium text-[#252820]">Completion Evidence Submitted</p>
          <p className="mt-0.5 leading-relaxed text-[#263D30]">
            This task has been forwarded to the municipal administrator for final verification and ticket resolution. No further field action is required at this stage.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF8F2] border border-[#DDD9CE] rounded-sm p-5 sm:p-6 space-y-5">
      <div className="border-b border-[#DDD9CE] pb-3 flex items-center justify-between">
        <h2 className="font-serif text-base font-medium text-[#1B3A2E]">
          Field Action Controls
        </h2>
        <span className="text-xs font-mono font-medium text-[#1B3A2E] bg-[#ECE9DF] px-2 py-0.5 rounded-sm border border-[#DDD9CE]">
          Status: {task.status.replace(/_/g, " ")}
        </span>
      </div>

      {msg && (
        <div
          className={`text-xs sm:text-sm px-4 py-3 rounded-sm flex items-center gap-2 ${
            msg.type === "success"
              ? "bg-[#ECE9DF] text-[#1B3A2E] border border-[#718267]"
              : "bg-[#FAF0EE] text-[#8B342E] border border-[#E5C9C6]"
          }`}
        >
          <span>{msg.text}</span>
        </div>
      )}

      {/* Acknowledge */}
      {task.status === "pending" && (
        <div className="space-y-3 p-4 bg-[#F7F5EE] rounded-sm border border-[#DDD9CE]">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#1B3A2E]">
              Step 1: Acknowledge Task
            </p>
            <p className="text-xs text-[#77796F] mt-1">
              Confirm receipt of this dispatch order so administration knows you are handling this issue.
            </p>
          </div>
          <Button
            className="bg-[#1B3A2E] hover:bg-[#263D30] text-[#F7F5EE] w-full text-sm font-medium py-3.5 h-12 shadow-none"
            disabled={busy}
            onClick={() =>
              act(
                () => patchTask({ status: "accepted" }),
                "Task acknowledged successfully."
              )
            }
          >
            {busy ? "Updating..." : "Acknowledge Task Assignment"}
          </Button>
        </div>
      )}

      {/* Start work */}
      {task.status === "accepted" && (
        <div className="space-y-3 p-4 bg-[#F7F5EE] rounded-sm border border-[#DDD9CE]">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#1B3A2E]">
              Step 2: Commence On-Site Work
            </p>
            <p className="text-xs text-[#77796F] mt-1">
              Click when you arrive on site and start resolving the civic issue. This updates the citizen tracking status to &quot;In Progress&quot;.
            </p>
          </div>
          <Button
            className="bg-[#1B3A2E] hover:bg-[#263D30] text-[#F7F5EE] w-full text-sm font-medium py-3.5 h-12 shadow-none"
            disabled={busy}
            onClick={() =>
              act(
                () => patchTask({ status: "in_progress" }),
                "Work marked In Progress. Citizen and admin notified."
              )
            }
          >
            {busy ? "Updating..." : "Start On-Site Work Now"}
          </Button>
        </div>
      )}

      {/* Submit for verification */}
      {task.status === "in_progress" && (
        <div className="space-y-4 p-4 bg-[#F7F5EE] rounded-sm border border-[#DDD9CE]">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#1B3A2E]">
              Step 3: Document Resolution & Upload Evidence
            </p>
            <p className="text-xs text-[#77796F] mt-1">
              Capture clear photographs showing the rectified defect and write brief notes.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#252820]">
              Resolution Description / Work Completed <span className="text-[#8B342E]">*</span>
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Cleared drainage blockage, replaced cracked cover, tested water outflow..."
              className="border-[#DDD9CE] bg-[#FAF8F2] text-xs sm:text-sm resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-[#252820]">
              Evidence Photographs <span className="text-[#8B342E]">*</span>
              <span className="text-[#77796F] font-normal ml-1">
                (Required, 1 to 5 clear on-site photos)
              </span>
            </Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-[#DDD9CE] rounded-sm p-5 text-center bg-[#FAF8F2] cursor-pointer hover:border-[#718267] transition-colors"
            >
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="h-10 w-10 rounded-full bg-[#ECE9DF] flex items-center justify-center text-[#1B3A2E]">
                  <Camera className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-[#252820]">
                  Tap to Take Photo or Select Files
                </p>
                <p className="text-[11px] text-[#77796F]">
                  Supports smartphone camera directly · Max 5 images
                </p>
              </div>
            </div>

            {previews.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-xs font-semibold text-[#1B3A2E]">
                  Selected Proof Photos ({previews.length}/5):
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {previews.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={src}
                      alt={`Preview ${i + 1}`}
                      className="h-20 w-full object-cover rounded-sm border border-[#DDD9CE]"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button
            className="bg-[#1B3A2E] hover:bg-[#263D30] text-[#F7F5EE] w-full text-sm font-medium py-3.5 h-12 shadow-none"
            disabled={busy || !notes.trim() || files.length === 0}
            onClick={() =>
              act(async () => {
                const urls = await uploadImages();
                await patchTask({
                  status: "completed",
                  notes: notes.trim(),
                  evidenceImages: urls,
                });
              }, "Evidence submitted successfully. Awaiting admin verification.")
            }
          >
            {busy ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Uploading Evidence...
              </span>
            ) : (
              "Submit Completion Evidence for Verification"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
