import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { getComplaintsServer as getComplaints } from "@/services/server/complaints.server";
import AdminLayout from "@/components/admin/AdminLayout";
import { LoadingState } from "@/components/shared/loading-state";
import ComplaintsTableClient from "./ComplaintsTableClient";

async function Content() {
  const session = await getCurrentSession();
  if (!session || session.role !== "admin") redirect("/unauthorized?reason=admin_required");

  const complaints = await getComplaints({});

  return <ComplaintsTableClient complaints={complaints} />;
}

export default function AdminComplaintsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#30352D]">Complaint Management</h1>
          <p className="text-sm text-[#74796F] mt-1">
            Review, filter and manage all submitted civic complaints.
          </p>
        </div>
        <Suspense fallback={<LoadingState message="Loading complaints..." />}>
          <Content />
        </Suspense>
      </div>
    </AdminLayout>
  );
}
