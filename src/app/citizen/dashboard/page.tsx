import { Suspense } from 'react';
import { getCurrentSession } from '@/lib/auth/session';
import { getCitizenComplaintStatsServer, getRecentComplaintsServer, getCitizenNotificationsServer } from '@/services/server/complaints.server';
import { StatCard } from '@/components/citizen/StatCard';
import { ComplaintCard } from '@/components/citizen/ComplaintCard';
import { NotificationItem } from '@/components/citizen/NotificationItem';
import DashboardLayout from '@/components/citizen/DashboardLayout';
import { LoadingState } from '@/components/shared/loading-state';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileText, Clock, Wrench, CheckCircle2, ArrowRight } from 'lucide-react';

async function DashboardContent() {
  const session = await getCurrentSession();
  if (!session) {
    return <p className="text-sm text-[#74796F]">Loading session...</p>;
  }
  const uid = session.uid;
  const [stats, recentComplaints, notifications] = await Promise.all([
    getCitizenComplaintStatsServer(uid),
    getRecentComplaintsServer(uid, 6),
    getCitizenNotificationsServer(uid, 5),
  ]);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E8DF]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#30352D]">
            Welcome back, {session.displayName ?? session.email?.split('@')[0]}
          </h1>
          <p className="text-xs text-[#74796F] mt-0.5">
            Citizen Services Portal · Track and report civic issues in your municipality
          </p>
        </div>
        <Link href="/citizen/report">
          <Button className="bg-[#788568] hover:bg-[#536247] text-white text-sm font-medium gap-2 shadow-none">
            <PlusCircle className="h-4 w-4" />
            <span>Report New Issue</span>
          </Button>
        </Link>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FileText}
          label="Total Filed"
          value={stats.total}
          description="All submitted reports"
        />
        <StatCard
          icon={Clock}
          label="Pending Triage"
          value={stats.pending}
          description="Awaiting municipal review"
        />
        <StatCard
          icon={Wrench}
          label="In Progress"
          value={stats.inProgress}
          description="Assigned to field team"
        />
        <StatCard
          icon={CheckCircle2}
          label="Resolved"
          value={stats.resolved}
          description="Work completed & verified"
        />
      </div>

      {/* Main Content Grid: Complaints & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Complaints (2 cols on lg) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#30352D]">Recent Complaints</h2>
              <p className="text-xs text-[#74796F]">Issues you have reported across your ward</p>
            </div>
            <Link
              href="/citizen/complaints"
              className="text-xs font-medium text-[#536247] hover:underline flex items-center gap-1"
            >
              <span>View all ({stats.total})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentComplaints.length === 0 ? (
            <div className="bg-white border border-[#E5E8DF] rounded-md p-8 text-center space-y-3">
              <FileText className="h-8 w-8 text-[#B4BBA5] mx-auto" />
              <div>
                <p className="text-sm font-medium text-[#30352D]">No complaints filed yet</p>
                <p className="text-xs text-[#74796F] mt-1">
                  Spot a civic problem in your area? Report it directly to municipal officials.
                </p>
              </div>
              <Link href="/citizen/report">
                <Button size="sm" className="bg-[#788568] hover:bg-[#536247] text-white text-xs mt-2">
                  File your first report
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentComplaints.map((c) => (
                <ComplaintCard key={c.id} complaint={c} />
              ))}
            </div>
          )}
        </div>

        {/* Notifications Sidebar (1 col on lg) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#30352D]">Recent Activity</h2>
              <p className="text-xs text-[#74796F]">Status updates & alerts</p>
            </div>
            <Link
              href="/citizen/notifications"
              className="text-xs font-medium text-[#536247] hover:underline"
            >
              Inbox
            </Link>
          </div>

          {notifications.length === 0 ? (
            <div className="bg-white border border-[#E5E8DF] rounded-md p-6 text-center text-xs text-[#74796F]">
              No new alerts. Updates regarding your complaints will appear here.
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n: any) => (
                <NotificationItem
                  key={n.id}
                  title={n.title ?? 'Status Update'}
                  message={n.message ?? ''}
                  timestamp={n.createdAt}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<LoadingState message="Loading citizen dashboard..." />}> 
        <DashboardContent />
      </Suspense>
    </DashboardLayout>
  );
}
