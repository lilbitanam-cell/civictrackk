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
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#718267]">
            Resident Inbox
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1B3A2E] mt-1">
            Notifications &amp; Dispatch Alerts
          </h1>
          <p className="text-sm text-[#77796F] mt-1">Updates about your filed civic complaints.</p>
        </div>
        <Suspense fallback={<LoadingState message="Loading notifications..." />}>
          <Content />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
