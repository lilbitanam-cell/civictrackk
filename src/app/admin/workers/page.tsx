"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { getUsersByRole, updateUserProfile } from "@/services/users.service";
import { getActiveDepartments } from "@/services/departments.service";
import { UserDocument, DepartmentDocument } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function WorkersPage() {
  const [workers, setWorkers] = useState<UserDocument[]>([]);
  const [departments, setDepartments] = useState<DepartmentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Create worker form
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: "", password: "", displayName: "", phone: "", departmentId: "", departmentName: "",
  });

  // Edit worker form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ displayName: "", phone: "", departmentId: "", departmentName: "" });

  const load = () => {
    setLoading(true);
    Promise.all([getUsersByRole("worker"), getActiveDepartments()])
      .then(([w, d]) => { setWorkers(w); setDepartments(d); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const createWorker = async () => {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/admin/workers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setShowCreate(false);
      setCreateForm({ email: "", password: "", displayName: "", phone: "", departmentId: "", departmentName: "" });
      setMsg("Worker created successfully.");
      load();
    } catch (e: any) { setMsg("Error: " + e.message); }
    finally { setBusy(false); }
  };

  const saveEdit = async (id: string) => {
    setBusy(true); setMsg(null);
    try {
      await updateUserProfile(id, {
        displayName: editForm.displayName,
        phone: editForm.phone,
        departmentId: editForm.departmentId,
        departmentName: editForm.departmentName,
      });
      setEditingId(null);
      setMsg("Worker updated.");
      load();
    } catch (e: any) { setMsg("Error: " + e.message); }
    finally { setBusy(false); }
  };

  const toggleActive = async (w: UserDocument) => {
    await updateUserProfile(w.id, { isActive: !w.isActive });
    load();
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E5E8DF]">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#30352D]">
              Field Personnel Directory
            </h1>
            <p className="text-xs sm:text-sm text-[#74796F] mt-0.5">
              Provision, assign departments, and maintain active status for field workers.
            </p>
          </div>
          <Button
            className="bg-[#788568] hover:bg-[#536247] text-white text-xs sm:text-sm font-semibold shadow-none"
            onClick={() => setShowCreate(true)}
          >
            + Register Field Worker
          </Button>
        </div>

        {msg && (
          <div className="text-xs sm:text-sm px-4 py-2.5 rounded-md bg-[#E9EDE4] text-[#3E4B37] border border-[#B4BBA5]">
            {msg}
          </div>
        )}

        {/* Create form */}
        {showCreate && (
          <div className="bg-white border border-[#E5E8DF] rounded-lg p-5 sm:p-6 space-y-4 max-w-xl shadow-xs">
            <div className="border-b border-[#F1F3EC] pb-3">
              <h2 className="text-sm font-bold text-[#30352D]">
                Register New Field Worker Account
              </h2>
              <p className="text-xs text-[#74796F] mt-0.5">
                Worker will use these credentials to access the outdoor mobile task portal.
              </p>
            </div>

            <div className="space-y-3">
              {[
                ["email", "Official Email Address", "email", "worker@municipality.gov.in"],
                ["password", "Initial Password", "password", "••••••••"],
                ["displayName", "Full Legal Name", "text", "e.g. Ramesh Kumar"],
                ["phone", "Mobile Number", "tel", "+91 98765 43210"],
              ].map(([key, label, type, placeholder]) => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs font-medium text-[#74796F]">{label}</Label>
                  <Input
                    type={type as string}
                    placeholder={placeholder}
                    value={(createForm as any)[key]}
                    onChange={(e) =>
                      setCreateForm((p) => ({ ...p, [key]: e.target.value }))
                    }
                    className="border-[#E5E8DF] text-xs sm:text-sm focus-visible:ring-[#788568]"
                  />
                </div>
              ))}

              <div className="space-y-1">
                <Label className="text-xs font-medium text-[#74796F]">
                  Assigned Municipal Department
                </Label>
                <Select
                  value={createForm.departmentId}
                  onValueChange={(v) => {
                    const d = departments.find((d) => d.id === v);
                    setCreateForm((p) => ({
                      ...p,
                      departmentId: v,
                      departmentName: d?.name || "",
                    }));
                  }}
                >
                  <SelectTrigger className="border-[#E5E8DF] text-xs sm:text-sm focus:ring-[#788568]">
                    <SelectValue placeholder="Select primary department" />
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
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                className="bg-[#788568] hover:bg-[#536247] text-white text-xs sm:text-sm font-semibold"
                onClick={createWorker}
                disabled={busy || !createForm.email || !createForm.password}
              >
                {busy ? "Registering..." : "Create Worker Account"}
              </Button>
              <Button
                variant="outline"
                className="text-xs sm:text-sm border-[#E5E8DF] text-[#30352D] hover:bg-[#F1F3EC]"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <p className="text-xs text-[#74796F]">Loading personnel records...</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#E5E8DF] bg-white shadow-xs">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-[#F8F9F5] text-[#30352D] border-b border-[#E5E8DF]">
                <tr>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] text-[#74796F]">Worker Name</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] text-[#74796F]">Email / Contact</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] text-[#74796F]">Department</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] text-[#74796F]">Status</th>
                  <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider text-[11px] text-[#74796F]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E8DF]">
                {workers.map((w) => (
                  <tr key={w.id} className="hover:bg-[#F8F9F5] transition-colors">
                    {editingId === w.id ? (
                      <>
                        <td className="px-4 py-3.5" colSpan={2}>
                          <div className="flex flex-wrap gap-2">
                            <Input
                              value={editForm.displayName}
                              onChange={(e) =>
                                setEditForm((p) => ({ ...p, displayName: e.target.value }))
                              }
                              className="border-[#E5E8DF] text-xs w-40"
                              placeholder="Name"
                            />
                            <Input
                              value={editForm.phone}
                              onChange={(e) =>
                                setEditForm((p) => ({ ...p, phone: e.target.value }))
                              }
                              placeholder="Phone"
                              className="border-[#E5E8DF] text-xs w-36"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <Select
                            value={editForm.departmentId}
                            onValueChange={(v) => {
                              const d = departments.find((d) => d.id === v);
                              setEditForm((p) => ({
                                ...p,
                                departmentId: v,
                                departmentName: d?.name || "",
                              }));
                            }}
                          >
                            <SelectTrigger className="border-[#E5E8DF] text-xs w-44">
                              <SelectValue placeholder="Select dept" />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.map((d) => (
                                <SelectItem key={d.id} value={d.id} className="text-xs">
                                  {d.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-3.5" />
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex gap-2">
                            <Button
                              size="sm"
                              className="text-xs bg-[#788568] hover:bg-[#536247] text-white h-7 px-2.5"
                              onClick={() => saveEdit(w.id)}
                              disabled={busy}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs border-[#E5E8DF] text-[#30352D] h-7 px-2.5"
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3.5 font-semibold text-[#30352D]">
                          {w.displayName}
                        </td>
                        <td className="px-4 py-3.5 text-[#74796F]">
                          <p>{w.email}</p>
                          {w.phone && (
                            <p className="text-[11px] text-[#536247] mt-0.5">{w.phone}</p>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-[#30352D] font-medium">
                          {w.departmentName || "—"}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                              w.isActive
                                ? "bg-[#E9EDE4] text-[#3E4B37] border border-[#B4BBA5]"
                                : "bg-[#F1F3EC] text-[#74796F] border border-[#E5E8DF]"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                w.isActive ? "bg-[#536247]" : "bg-neutral-400"
                              }`}
                            />
                            {w.isActive ? "Active Duty" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs border-[#E5E8DF] hover:bg-[#F1F3EC] text-[#30352D] h-7 px-2.5"
                              onClick={() => {
                                setEditingId(w.id);
                                setEditForm({
                                  displayName: w.displayName,
                                  phone: w.phone || "",
                                  departmentId: w.departmentId || "",
                                  departmentName: w.departmentName || "",
                                });
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className={`text-xs h-7 px-2.5 ${
                                w.isActive
                                  ? "border-red-200 text-red-700 hover:bg-red-50"
                                  : "border-[#E5E8DF] text-[#536247] hover:bg-[#F1F3EC]"
                              }`}
                              onClick={() => toggleActive(w)}
                            >
                              {w.isActive ? "Deactivate" : "Activate"}
                            </Button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
