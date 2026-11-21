"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { getAllDepartments, createDepartment, updateDepartment } from "@/services/departments.service";
import { DepartmentDocument, ComplaintCategory } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const ALL_CATEGORIES: { value: ComplaintCategory; label: string }[] = [
  { value: "roads_potholes", label: "Roads & Potholes" },
  { value: "garbage_collection", label: "Garbage" },
  { value: "water_leakage", label: "Water Leakage" },
  { value: "drainage", label: "Drainage" },
  { value: "streetlights", label: "Streetlights" },
  { value: "public_infrastructure", label: "Public Infrastructure" },
  { value: "sanitation", label: "Sanitation" },
  { value: "other", label: "Other" },
];

const DEFAULT_FORM = {
  name: "", code: "", description: "", headName: "", headEmail: "",
  contactNumber: "", slaHours: 48, categories: [] as ComplaintCategory[],
};

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<DepartmentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DepartmentDocument | null>(null);
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const loadDepts = () => {
    setLoading(true);
    getAllDepartments().then(setDepartments).finally(() => setLoading(false));
  };

  useEffect(() => { loadDepts(); }, []);

  const openCreate = () => { setEditing(null); setForm({ ...DEFAULT_FORM }); setShowForm(true); };
  const openEdit = (d: DepartmentDocument) => {
    setEditing(d);
    setForm({
      name: d.name, code: d.code, description: d.description,
      headName: d.headName || "", headEmail: d.headEmail || "",
      contactNumber: d.contactNumber || "", slaHours: d.slaHours,
      categories: d.categories,
    });
    setShowForm(true);
  };

  const toggleActive = async (d: DepartmentDocument) => {
    await updateDepartment(d.id, { isActive: !d.isActive });
    loadDepts();
  };

  const handleSubmit = async () => {
    setBusy(true); setMsg(null);
    try {
      if (editing) {
        await updateDepartment(editing.id, form);
      } else {
        await createDepartment({ ...form, activeWorkersCount: 0, isActive: true });
      }
      setShowForm(false);
      loadDepts();
      setMsg("Saved successfully.");
    } catch (e: any) { setMsg("Error: " + e.message); }
    finally { setBusy(false); }
  };

  const toggleCategory = (cat: ComplaintCategory) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E5E8DF]">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#30352D]">
              Municipal Departments
            </h1>
            <p className="text-xs sm:text-sm text-[#74796F] mt-0.5">
              Configure municipal divisions, SLA timeframes, and issue category assignments.
            </p>
          </div>
          <Button
            className="bg-[#788568] hover:bg-[#536247] text-white text-xs sm:text-sm font-semibold shadow-none"
            onClick={openCreate}
          >
            + Register Department
          </Button>
        </div>

        {msg && (
          <div className="text-xs sm:text-sm px-4 py-2.5 rounded-md bg-[#E9EDE4] text-[#3E4B37] border border-[#B4BBA5]">
            {msg}
          </div>
        )}

        {/* Form Modal / Panel */}
        {showForm && (
          <div className="bg-white border border-[#E5E8DF] rounded-lg p-5 sm:p-6 space-y-4 max-w-2xl shadow-xs">
            <div className="border-b border-[#F1F3EC] pb-3">
              <h2 className="text-sm font-bold text-[#30352D]">
                {editing ? "Modify Department Configuration" : "Register New Municipal Department"}
              </h2>
              <p className="text-xs text-[#74796F] mt-0.5">
                Set division credentials, contact point, and category routing.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-[#74796F]">Department Name</Label>
                <Input
                  value={form.name}
                  placeholder="e.g. Public Works Department"
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="border-[#E5E8DF] text-xs sm:text-sm focus-visible:ring-[#788568]"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-[#74796F]">Department Code</Label>
                <Input
                  value={form.code}
                  placeholder="e.g. PWD-01"
                  onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                  className="border-[#E5E8DF] text-xs sm:text-sm font-mono focus-visible:ring-[#788568]"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs font-medium text-[#74796F]">Description</Label>
                <Textarea
                  value={form.description}
                  placeholder="Scope of work and responsibilities..."
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="border-[#E5E8DF] text-xs sm:text-sm resize-none focus-visible:ring-[#788568]"
                  rows={2}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-[#74796F]">Head of Department</Label>
                <Input
                  value={form.headName}
                  placeholder="Name of Executive Officer"
                  onChange={(e) => setForm((prev) => ({ ...prev, headName: e.target.value }))}
                  className="border-[#E5E8DF] text-xs sm:text-sm focus-visible:ring-[#788568]"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-[#74796F]">Official Email</Label>
                <Input
                  type="email"
                  value={form.headEmail}
                  placeholder="officer@municipality.gov.in"
                  onChange={(e) => setForm((prev) => ({ ...prev, headEmail: e.target.value }))}
                  className="border-[#E5E8DF] text-xs sm:text-sm focus-visible:ring-[#788568]"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-[#74796F]">Helpline / Contact</Label>
                <Input
                  value={form.contactNumber}
                  placeholder="+91 11 2345 6789"
                  onChange={(e) => setForm((prev) => ({ ...prev, contactNumber: e.target.value }))}
                  className="border-[#E5E8DF] text-xs sm:text-sm focus-visible:ring-[#788568]"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-[#74796F]">SLA Resolution Target (Hours)</Label>
                <Input
                  type="number"
                  value={form.slaHours}
                  onChange={(e) => setForm((prev) => ({ ...prev, slaHours: Number(e.target.value) }))}
                  className="border-[#E5E8DF] text-xs sm:text-sm w-32 focus-visible:ring-[#788568]"
                />
              </div>
            </div>

            <div className="space-y-2 pt-1 border-t border-[#F1F3EC]">
              <Label className="text-xs font-medium text-[#74796F]">
                Assigned Grievance Categories (Click to toggle)
              </Label>
              <div className="flex flex-wrap gap-2">
                {ALL_CATEGORIES.map(({ value, label }) => {
                  const selected = form.categories.includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleCategory(value)}
                      className={`px-2.5 py-1 text-xs rounded-md border font-medium transition-colors ${
                        selected
                          ? "bg-[#536247] text-white border-[#536247]"
                          : "border-[#E5E8DF] text-[#74796F] bg-[#F8F9F5] hover:border-[#788568]"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                className="bg-[#788568] hover:bg-[#536247] text-white text-xs sm:text-sm font-semibold"
                onClick={handleSubmit}
                disabled={busy || !form.name.trim()}
              >
                {busy ? "Saving..." : "Save Department"}
              </Button>
              <Button
                variant="outline"
                className="text-xs sm:text-sm border-[#E5E8DF] text-[#30352D] hover:bg-[#F1F3EC]"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <p className="text-xs text-[#74796F]">Loading departments registry...</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#E5E8DF] bg-white shadow-xs">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-[#F8F9F5] text-[#30352D] border-b border-[#E5E8DF]">
                <tr>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] text-[#74796F]">Department</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] text-[#74796F]">Code</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] text-[#74796F]">SLA Target</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] text-[#74796F]">Categories</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] text-[#74796F]">Status</th>
                  <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider text-[11px] text-[#74796F]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E8DF]">
                {departments.map((d) => (
                  <tr key={d.id} className="hover:bg-[#F8F9F5] transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="text-xs font-semibold text-[#30352D]">{d.name}</p>
                      {d.headName && (
                        <p className="text-[11px] text-[#74796F] mt-0.5">Head: {d.headName}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-[11px] text-[#536247] bg-[#F1F3EC] px-2 py-0.5 rounded border border-[#E5E8DF]">
                        {d.code}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[#30352D] font-medium">
                      {d.slaHours} hours
                    </td>
                    <td className="px-4 py-3.5 text-[#74796F]">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {d.categories && d.categories.length > 0 ? (
                          d.categories.map((cat) => (
                            <span
                              key={cat}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-[#F1F3EC] text-[#536247] capitalize"
                            >
                              {cat.replace(/_/g, " ")}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-[#74796F]">All categories</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                          d.isActive
                            ? "bg-[#E9EDE4] text-[#3E4B37] border border-[#B4BBA5]"
                            : "bg-[#F1F3EC] text-[#74796F] border border-[#E5E8DF]"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            d.isActive ? "bg-[#536247]" : "bg-neutral-400"
                          }`}
                        />
                        {d.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs border-[#E5E8DF] hover:bg-[#F1F3EC] text-[#30352D] h-7 px-2.5"
                          onClick={() => openEdit(d)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`text-xs h-7 px-2.5 ${
                            d.isActive
                              ? "border-red-200 text-red-700 hover:bg-red-50"
                              : "border-[#E5E8DF] text-[#536247] hover:bg-[#F1F3EC]"
                          }`}
                          onClick={() => toggleActive(d)}
                        >
                          {d.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </td>
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
