"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { WorkerTaskDocument } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getClientAuth, getClientStorage } from "@/lib/firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Camera, CheckCircle2, UploadCloud, AlertCircle, Loader2 } from "lucide-react";

export default function WorkerTaskActions({ task }: { task: WorkerTaskDocument }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const patchTask = async (body: Record<string, unknown>) => {
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error((await res.json()).error || "Request failed");
  };

  const act = async (fn: () => Promise<void>, successMsg: string) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      setMsg({ type: "success", text: successMsg });
      router.refresh();
    } catch (e: any) {
      setMsg({ type: "error", text: e.message });
    } finally {
      setBusy(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []).slice(0, 5);
    setFiles(selected);
    setPreviews(selected.map((f) => URL.createObjectURL(f)));
  };

  const uploadImages = async () => {
    const user = getClientAuth().currentUser;
    if (!user) throw new Error("Not authenticated");
    const storage = getClientStorage();
    const urls: string[] = [];
    for (const file of files) {
      const storageRef = ref(storage, `taskEvidence/${user.uid}/${task.id}/${Date.now()}_${file.name}`);
      const snap = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snap.ref);
      urls.push(url);
    }
    return urls;
  };

  if (task.status === "completed") {
    return (
      <div className="bg-[#E9EDE4] border border-[#B4BBA5] rounded-lg p-5 text-sm text-[#3E4B37] flex items-start gap-3 shadow-xs">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-[#536247] mt-0.5" />
        <div>
          <p className="font-bold text-[#30352D]">Completion Evidence Submitted</p>
          <p className="mt-0.5 leading-relaxed text-[#536247]">
            This task has been forwarded to the municipal administrator for final verification and ticket resolution. No further field action is required at this stage.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E5E8DF] rounded-lg p-5 sm:p-6 space-y-5 shadow-xs">
      <div className="border-b border-[#F1F3EC] pb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-[#30352D] uppercase tracking-wider">
          Field Action Controls
        </h2>
        <span className="text-xs font-mono font-medium text-[#536247] bg-[#F1F3EC] px-2 py-0.5 rounded border border-[#E5E8DF]">
          Status: {task.status.replace(/_/g, " ")}
        </span>
      </div>

      {msg && (
        <div
          className={`text-xs sm:text-sm px-4 py-3 rounded-md flex items-center gap-2 ${
            msg.type === "success"
              ? "bg-[#E9EDE4] text-[#3E4B37] border border-[#B4BBA5]"
              : "bg-red-50 text-red-700 border border-red-300"
          }`}
        >
          <span>{msg.text}</span>
        </div>
      )}

      {/* Acknowledge */}
      {task.status === "pending" && (
        <div className="space-y-3 p-4 bg-[#F8F9F5] rounded-lg border border-[#E5E8DF]">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#536247]">
              Step 1: Acknowledge Task
            </p>
            <p className="text-xs text-[#74796F] mt-1">
              Confirm receipt of this dispatch order so administration knows you are handling this issue.
            </p>
          </div>
          <Button
            className="bg-[#788568] hover:bg-[#536247] text-white w-full text-sm font-bold py-3.5 h-12 shadow-none"
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
        <div className="space-y-3 p-4 bg-[#F8F9F5] rounded-lg border border-[#E5E8DF]">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#536247]">
              Step 2: Commence On-Site Work
            </p>
            <p className="text-xs text-[#74796F] mt-1">
              Click when you arrive on site and start resolving the civic issue. This updates the citizen tracking status to &quot;In Progress&quot;.
            </p>
          </div>
          <Button
            className="bg-[#536247] hover:bg-[#3E4B37] text-white w-full text-sm font-bold py-3.5 h-12 shadow-none"
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
        <div className="space-y-4 p-4 bg-[#F8F9F5] rounded-lg border border-[#E5E8DF]">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#536247]">
              Step 3: Document Resolution & Upload Evidence
            </p>
            <p className="text-xs text-[#74796F] mt-1">
              Capture clear photographs showing the rectified defect and write brief notes.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#30352D]">
              Resolution Description / Work Completed <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Cleared drainage blockage, replaced cracked cover, tested water outflow..."
              className="border-[#E5E8DF] bg-white text-xs sm:text-sm resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-[#30352D]">
              Evidence Photographs <span className="text-red-500">*</span>
              <span className="text-[#74796F] font-normal ml-1">
                (Required, 1 to 5 clear on-site photos)
              </span>
            </Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-[#D8DDD1] rounded-lg p-5 text-center bg-white cursor-pointer hover:border-[#788568] transition-colors"
            >
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="h-10 w-10 rounded-full bg-[#F1F3EC] flex items-center justify-center text-[#788568]">
                  <Camera className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-[#30352D]">
                  Tap to Take Photo or Select Files
                </p>
                <p className="text-[11px] text-[#74796F]">
                  Supports smartphone camera directly · Max 5 images
                </p>
              </div>
            </div>

            {previews.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-xs font-semibold text-[#536247]">
                  Selected Proof Photos ({previews.length}/5):
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {previews.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={src}
                      alt={`Preview ${i + 1}`}
                      className="h-20 w-full object-cover rounded-md border border-[#E5E8DF]"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button
            className="bg-[#3E4B37] hover:bg-[#30352D] text-white w-full text-sm font-bold py-3.5 h-12 shadow-none"
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
