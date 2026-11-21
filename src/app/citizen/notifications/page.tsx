import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { getCitizenNotificationsServer as getUserNotifications } from "@/services/server/complaints.server";
import DashboardLayout from "@/components/citizen/DashboardLayout";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import NotificationsClient from "./NotificationsClient";

async function Content() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  const notifications = (await getUserNotifications(session.uid, 50)) as any[];
  return notifications.length === 0 ? (
    <EmptyState title="No notifications" description="You have no notifications yet. They'll appear here when your complaint status changes." />
  ) : (
    <NotificationsClient notifications={notifications} />
  );
}

export default function CitizenNotificationsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#30352D]">Notifications</h1>
          <p className="text-sm text-[#74796F] mt-1">Updates about your complaints.</p>
        </div>
        <Suspense fallback={<LoadingState message="Loading notifications..." />}>
          <Content />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
