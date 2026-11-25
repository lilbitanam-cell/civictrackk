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
    getAllDepartments()
      .then(setDepartments)
      .catch((err: unknown) => {
        setMsg("Error loading departments: " + (err instanceof Error ? err.message : "Unknown error"));
      })
      .finally(() => setLoading(false));
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
    setBusy(true); setMsg(null);
    try {
      await updateDepartment(d.id, { isActive: !d.isActive });
      setMsg(`Department ${!d.isActive ? "activated" : "deactivated"} successfully.`);
      loadDepts();
    } catch (e: unknown) {
      setMsg("Error: " + (e instanceof Error ? e.message : "Failed to update department"));
    } finally {
      setBusy(false);
    }
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#DDD9CE]">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#718267] font-medium">
              Organizational Registry
            </p>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1B3A2E] mt-1">
              Municipal Departments
            </h1>
            <p className="text-xs sm:text-sm text-[#77796F] mt-0.5">
              Configure municipal divisions, SLA timeframes, and issue category assignments.
            </p>
          </div>
          <Button
            className="bg-[#1B3A2E] hover:bg-[#263D30] text-[#F7F5EE] text-xs sm:text-sm font-medium shadow-none"
            onClick={openCreate}
          >
            + Register Department
          </Button>
        </div>

        {msg && (
          <div className="text-xs sm:text-sm px-4 py-2.5 rounded-sm bg-[#ECE9DF] text-[#1B3A2E] border border-[#718267]">
            {msg}
          </div>
        )}

        {/* Form Modal / Panel */}
        {showForm && (
          <div className="bg-[#FAF8F2] border border-[#DDD9CE] rounded-sm p-5 sm:p-6 space-y-4 max-w-2xl">
            <div className="border-b border-[#DDD9CE] pb-3">
              <h2 className="font-serif text-base font-medium text-[#252820]">
                {editing ? "Modify Department Configuration" : "Register New Municipal Department"}
              </h2>
              <p className="text-xs text-[#77796F] mt-0.5">
                Set division credentials, contact point, and category routing.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-[#77796F]">Department Name</Label>
                <Input
                  value={form.name}
                  placeholder="e.g. Public Works Department"
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="border-[#DDD9CE] bg-[#F7F5EE] text-xs sm:text-sm focus-visible:ring-[#1B3A2E]"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-[#77796F]">Department Code</Label>
                <Input
                  value={form.code}
                  placeholder="e.g. PWD-01"
                  onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                  className="border-[#DDD9CE] bg-[#F7F5EE] text-xs sm:text-sm font-mono focus-visible:ring-[#1B3A2E]"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs font-medium text-[#77796F]">Description</Label>
                <Textarea
                  value={form.description}
                  placeholder="Scope of work and responsibilities..."
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="border-[#DDD9CE] bg-[#F7F5EE] text-xs sm:text-sm resize-none focus-visible:ring-[#1B3A2E]"
                  rows={2}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-[#77796F]">Head of Department</Label>
                <Input
                  value={form.headName}
                  placeholder="Name of Executive Officer"
                  onChange={(e) => setForm((prev) => ({ ...prev, headName: e.target.value }))}
                  className="border-[#DDD9CE] bg-[#F7F5EE] text-xs sm:text-sm focus-visible:ring-[#1B3A2E]"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-[#77796F]">Official Email</Label>
                <Input
                  type="email"
                  value={form.headEmail}
                  placeholder="officer@municipality.gov.in"
                  onChange={(e) => setForm((prev) => ({ ...prev, headEmail: e.target.value }))}
                  className="border-[#DDD9CE] bg-[#F7F5EE] text-xs sm:text-sm focus-visible:ring-[#1B3A2E]"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-[#77796F]">Helpline / Contact</Label>
                <Input
                  value={form.contactNumber}
                  placeholder="+91 11 2345 6789"
                  onChange={(e) => setForm((prev) => ({ ...prev, contactNumber: e.target.value }))}
                  className="border-[#DDD9CE] bg-[#F7F5EE] text-xs sm:text-sm focus-visible:ring-[#1B3A2E]"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-[#77796F]">SLA Resolution Target (Hours)</Label>
                <Input
                  type="number"
                  value={form.slaHours}
                  onChange={(e) => setForm((prev) => ({ ...prev, slaHours: Number(e.target.value) }))}
                  className="border-[#DDD9CE] bg-[#F7F5EE] text-xs sm:text-sm w-32 focus-visible:ring-[#1B3A2E]"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#DDD9CE]">
              <Label className="text-xs font-medium text-[#77796F]">
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
                      className={`px-2.5 py-1 text-xs rounded-sm border font-medium transition-colors ${
                        selected
                          ? "bg-[#1B3A2E] text-[#F7F5EE] border-[#1B3A2E]"
                          : "border-[#DDD9CE] text-[#77796F] bg-[#F7F5EE] hover:border-[#718267]"
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
                className="bg-[#1B3A2E] hover:bg-[#263D30] text-[#F7F5EE] text-xs sm:text-sm font-medium"
                onClick={handleSubmit}
                disabled={busy || !form.name.trim()}
              >
                {busy ? "Saving..." : "Save Department"}
              </Button>
              <Button
                variant="outline"
                className="text-xs sm:text-sm border-[#DDD9CE] text-[#252820] hover:bg-[#ECE9DF]"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <p className="text-xs text-[#77796F]">Loading departments registry...</p>
        ) : (
          <div className="overflow-x-auto rounded-sm border border-[#DDD9CE] bg-[#FAF8F2]">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-[#ECE9DF]/60 text-[#252820] border-b border-[#DDD9CE]">
                <tr>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] text-[#77796F]">Department</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] text-[#77796F]">Code</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] text-[#77796F]">SLA Target</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] text-[#77796F]">Categories</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] text-[#77796F]">Status</th>
                  <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider text-[11px] text-[#77796F]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDD9CE]">
                {departments.map((d) => (
                  <tr key={d.id} className="hover:bg-[#ECE9DF]/40 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="text-xs font-semibold text-[#252820]">{d.name}</p>
                      {d.headName && (
                        <p className="text-[11px] text-[#77796F] mt-0.5">Head: {d.headName}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-[11px] text-[#1B3A2E] bg-[#ECE9DF] px-2 py-0.5 rounded-sm border border-[#DDD9CE]">
                        {d.code}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[#252820] font-medium">
                      {d.slaHours} hours
                    </td>
                    <td className="px-4 py-3.5 text-[#77796F]">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {d.categories && d.categories.length > 0 ? (
                          d.categories.map((cat) => (
                            <span
                              key={cat}
                              className="px-1.5 py-0.5 rounded-sm text-[10px] bg-[#ECE9DF] text-[#263D30] capitalize"
                            >
                              {cat.replace(/_/g, " ")}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-[#77796F]">All categories</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                          d.isActive
                            ? "bg-[#ECE9DF] text-[#1B3A2E] border border-[#718267]"
                            : "bg-[#F7F5EE] text-[#77796F] border border-[#DDD9CE]"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            d.isActive ? "bg-[#1B3A2E]" : "bg-[#77796F]/60"
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
                          className="text-xs border-[#DDD9CE] hover:bg-[#ECE9DF] text-[#252820] h-7 px-2.5"
                          onClick={() => openEdit(d)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`text-xs h-7 px-2.5 ${
                            d.isActive
                              ? "border-[#E5C9C6] text-[#8B342E] hover:bg-[#FAF0EE]"
                              : "border-[#DDD9CE] text-[#1B3A2E] hover:bg-[#ECE9DF]"
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
