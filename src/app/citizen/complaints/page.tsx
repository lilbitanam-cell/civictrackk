import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { getComplaintsByCitizenServer as getComplaintsByCitizen } from "@/services/server/complaints.server";
import DashboardLayout from "@/components/citizen/DashboardLayout";
import { PageHeading } from "@/components/shared/page-heading";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ComplaintsListClient from "./ComplaintsListClient";

async function Content() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const complaints = await getComplaintsByCitizen(session.uid);

  return (
    <div className="space-y-6">
      <PageHeading
        title="My Complaints"
        description="Track the status of all complaints you've submitted."
        actions={
          <Link href="/citizen/report">
            <Button className="bg-[#788568] hover:bg-[#536247] text-white text-sm">
              Report Issue
            </Button>
          </Link>
        }
      />

      {complaints.length === 0 ? (
        <EmptyState
          title="No complaints yet"
          description="You haven't submitted any complaints. Use the button above to report a civic issue."
          action={
            <Link href="/citizen/report">
              <Button className="bg-[#788568] hover:bg-[#536247] text-white text-sm">
                Report your first issue
              </Button>
            </Link>
          }
        />
      ) : (
        <ComplaintsListClient complaints={complaints} />
      )}
    </div>
  );
}

export default function MyComplaintsPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<LoadingState message="Loading complaints..." />}>
        <Content />
      </Suspense>
    </DashboardLayout>
  );
}
