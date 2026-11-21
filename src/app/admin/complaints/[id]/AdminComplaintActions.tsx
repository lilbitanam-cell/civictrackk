"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ComplaintDocument, DepartmentDocument } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { getWorkersByDepartment } from "@/services/users.service";
import type { UserDocument } from "@/types";
import type { SessionPayload } from "@/lib/auth/session";

interface Props {
  complaint: ComplaintDocument;
  departments: DepartmentDocument[];
  session: SessionPayload;
}

export default function AdminComplaintActions({ complaint, departments, session }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Verify / reject
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectBox, setShowRejectBox] = useState(false);

  // Priority + remarks
  const [priority, setPriority] = useState(complaint.priority);
  const [remarks, setRemarks] = useState(complaint.adminRemarks || "");

  // Assignment
  const [deptId, setDeptId] = useState(complaint.departmentId || "");
  const [deptName, setDeptName] = useState(complaint.departmentName || "");
  const [workers, setWorkers] = useState<UserDocument[]>([]);
  const [workerId, setWorkerId] = useState(complaint.assignedWorkerId || "");
  const [workerName, setWorkerName] = useState(complaint.assignedWorkerName || "");
  const [instructions, setInstructions] = useState("");

  // Resolution verify
  const [resolveRejectReason, setResolveRejectReason] = useState("");
  const [showResolveReject, setShowResolveReject] = useState(false);

  useEffect(() => {
    if (deptId) {
      getWorkersByDepartment(deptId).then(setWorkers).catch(() => setWorkers([]));
    }
  }, [deptId]);

  const patch = async (body: Record<string, unknown>) => {
    const res = await fetch(`/api/complaints/${complaint.id}`, {
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

  return (
    <div className="bg-white border border-[#E5E8DF] rounded-lg p-5 sm:p-6 space-y-6 shadow-xs">
      <div className="border-b border-[#F1F3EC] pb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-[#30352D] uppercase tracking-wider">
          Municipal Operations & Workflow Actions
        </h2>
        <span className="text-[11px] text-[#74796F] font-mono">
          Stage: {complaint.status}
        </span>
      </div>

      {msg && (
        <div
          className={`text-xs sm:text-sm px-4 py-3 rounded-md ${
            msg.type === "success"
              ? "bg-[#E9EDE4] text-[#3E4B37] border border-[#B4BBA5]"
              : "bg-red-50 text-red-700 border border-red-300"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Verify / Reject complaint */}
      {["submitted", "under_review"].includes(complaint.status) && (
        <div className="space-y-3 border-b border-[#E5E8DF] pb-5">
          <p className="text-xs font-semibold text-[#536247] uppercase tracking-wider">
            1. Triage & Intake Verification
          </p>
          <p className="text-xs text-[#74796F]">
            Verify this complaint before routing to a municipal department, or reject if invalid.
          </p>
          <div className="flex gap-2.5 flex-wrap">
            <Button
              className="bg-[#788568] hover:bg-[#536247] text-white text-xs font-semibold"
              disabled={busy}
              onClick={() =>
                act(
                  () => patch({ status: "under_review" }),
                  "Complaint marked as Under Review."
                )
              }
            >
              Mark Under Review
            </Button>
            <Button
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50 text-xs"
              onClick={() => setShowRejectBox(!showRejectBox)}
            >
              Reject Grievance
            </Button>
          </div>
          {showRejectBox && (
            <div className="space-y-2 pt-2 p-3 bg-red-50/50 rounded-md border border-red-200">
              <Label className="text-xs font-medium text-red-800">
                Official Rejection Reason (Required)
              </Label>
              <Textarea
                placeholder="State why this grievance cannot be accepted..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="border-red-200 text-xs bg-white resize-none"
                rows={2}
              />
              <Button
                variant="outline"
                className="border-red-300 bg-red-600 text-white hover:bg-red-700 text-xs"
                disabled={busy || !rejectReason.trim()}
                onClick={() =>
                  act(
                    () =>
                      patch({
                        status: "rejected",
                        rejectionReason: rejectReason.trim(),
                      }),
                    "Complaint rejected and citizen notified."
                  )
                }
              >
                Confirm Rejection
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Priority + Remarks */}
      <div className="space-y-3 border-b border-[#E5E8DF] pb-5">
        <p className="text-xs font-semibold text-[#536247] uppercase tracking-wider">
          2. Priority Calibration & Administrative Remarks
        </p>
        <div className="flex gap-3 flex-wrap items-end">
          <div className="space-y-1">
            <Label className="text-xs font-medium text-[#74796F]">Priority Level</Label>
            <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
              <SelectTrigger className="w-40 border-[#E5E8DF] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["low", "medium", "high", "urgent"].map((p) => (
                  <SelectItem key={p} value={p} className="capitalize text-xs">
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            className="text-xs border-[#E5E8DF] text-[#30352D] hover:bg-[#F1F3EC]"
            disabled={busy}
            onClick={() => act(() => patch({ priority }), "Priority updated.")}
          >
            Update Priority
          </Button>
        </div>

        <div className="space-y-1.5 pt-1">
          <Label className="text-xs font-medium text-[#74796F]">Internal Municipal Remarks</Label>
          <Textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="border-[#E5E8DF] text-xs resize-none"
            rows={2}
            placeholder="Add internal notes for departmental coordination..."
          />
          <div className="flex justify-end">
            <Button
              variant="outline"
              className="text-xs border-[#E5E8DF] text-[#30352D] hover:bg-[#F1F3EC]"
              disabled={busy || !remarks.trim()}
              onClick={() =>
                act(() => patch({ adminRemarks: remarks.trim() }), "Remarks saved.")
              }
            >
              Save Remarks
            </Button>
          </div>
        </div>
      </div>

      {/* Assign Worker */}
      {!["rejected", "closed"].includes(complaint.status) && (
        <div className="space-y-3 border-b border-[#E5E8DF] pb-5">
          <p className="text-xs font-semibold text-[#536247] uppercase tracking-wider">
            3. Department & Field Worker Dispatch
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-[#74796F]">Department</Label>
              <Select
                value={deptId}
                onValueChange={(v) => {
                  setDeptId(v);
                  const d = departments.find((d) => d.id === v);
                  setDeptName(d?.name || v);
                  setWorkerId("");
                  setWorkerName("");
                }}
              >
                <SelectTrigger className="border-[#E5E8DF] text-xs">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id} className="text-xs">
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-[#74796F]">Field Worker</Label>
              <Select
                value={workerId}
                onValueChange={(v) => {
                  setWorkerId(v);
                  const w = workers.find((w) => w.id === v);
                  setWorkerName(w?.displayName || v);
                }}
                disabled={!deptId || workers.length === 0}
              >
                <SelectTrigger className="border-[#E5E8DF] text-xs">
                  <SelectValue
                    placeholder={
                      !deptId
                        ? "Select department first"
                        : workers.length === 0
                        ? "No workers in dept"
                        : "Select field worker"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {workers.map((w) => (
                    <SelectItem key={w.id} value={w.id} className="text-xs">
                      {w.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <Label className="text-xs font-medium text-[#74796F]">
              Field Instructions (Optional)
            </Label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="border-[#E5E8DF] text-xs resize-none"
              rows={2}
              placeholder="Instructions regarding required equipment, safety, or access constraints..."
            />
          </div>

          <Button
            className="bg-[#788568] hover:bg-[#536247] text-white text-xs font-semibold"
            disabled={busy || !deptId || !workerId}
            onClick={() =>
              act(async () => {
                const res = await fetch(`/api/complaints/${complaint.id}/assign`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    departmentId: deptId,
                    departmentName: deptName,
                    workerId,
                    workerName,
                    priority,
                    instructions,
                  }),
                });
                if (!res.ok)
                  throw new Error((await res.json()).error || "Assignment failed");
              }, "Field worker dispatched and complaint marked Assigned.")
            }
          >
            Dispatch Task to Worker
          </Button>
        </div>
      )}

      {/* Resolution verification */}
      {complaint.status === "resolution_submitted" && (
        <div className="space-y-3 bg-[#F1F3EC] p-4 rounded-md border border-[#D8DDD1]">
          <p className="text-xs font-semibold text-[#536247] uppercase tracking-wider">
            4. Resolution Audit & Final Verification
          </p>
          <p className="text-xs text-[#30352D] leading-relaxed">
            A field worker has completed the on-site resolution and submitted photographic proof. Review the evidence carefully before approving or returning the task.
          </p>

          {complaint.resolutionNotes && (
            <div className="bg-white p-3 rounded border border-[#E5E8DF] text-xs text-[#30352D]">
              <span className="font-semibold text-[#536247]">Worker Notes:</span>{" "}
              {complaint.resolutionNotes}
            </div>
          )}

          {complaint.resolutionImages && complaint.resolutionImages.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-xs text-[#74796F] font-semibold">
                Uploaded Evidence ({complaint.resolutionImages.length}):
              </span>
              <div className="flex gap-2 flex-wrap">
                {complaint.resolutionImages.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Evidence ${i + 1}`}
                      className="w-24 h-24 object-cover rounded-md border border-[#E5E8DF] hover:opacity-90"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2.5 flex-wrap pt-2">
            <Button
              className="bg-[#3E4B37] hover:bg-[#30352D] text-white text-xs font-semibold"
              disabled={busy}
              onClick={() =>
                act(async () => {
                  const res = await fetch(
                    `/api/admin/complaints/${complaint.id}/resolve`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "approve" }),
                    }
                  );
                  if (!res.ok)
                    throw new Error((await res.json()).error || "Approval failed");
                }, "Resolution verified & approved. Complaint marked Resolved.")
              }
            >
              Approve Resolution & Close Ticket
            </Button>
            <Button
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 text-xs"
              onClick={() => setShowResolveReject(!showResolveReject)}
            >
              Reject Resolution
            </Button>
          </div>

          {showResolveReject && (
            <div className="space-y-2 pt-2 p-3 bg-red-50/50 rounded-md border border-red-200">
              <Label className="text-xs font-medium text-red-800">
                Reason for Rejecting Resolution (Worker will be notified to re-perform work)
              </Label>
              <Textarea
                placeholder="Explain what work remains incomplete or deficient..."
                value={resolveRejectReason}
                onChange={(e) => setResolveRejectReason(e.target.value)}
                className="border-red-200 text-xs bg-white resize-none"
                rows={2}
              />
              <Button
                variant="outline"
                className="border-red-300 bg-red-600 text-white hover:bg-red-700 text-xs"
                disabled={busy || !resolveRejectReason.trim()}
                onClick={() =>
                  act(async () => {
                    const res = await fetch(
                      `/api/admin/complaints/${complaint.id}/resolve`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          action: "reject",
                          reason: resolveRejectReason.trim(),
                        }),
                      }
                    );
                    if (!res.ok)
                      throw new Error(
                        (await res.json()).error || "Rejection failed"
                      );
                  }, "Resolution rejected. Complaint reverted to In Progress.")
                }
              >
                Confirm Rejection & Reassign to Worker
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
