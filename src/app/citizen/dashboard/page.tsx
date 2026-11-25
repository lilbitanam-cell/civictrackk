export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
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

async function DashboardContent({
  success,
  ticket,
}: {
  success?: string;
  ticket?: string;
}) {
  const session = await getCurrentSession();
  if (!session) {
    redirect('/login');
  }
  const uid = session.uid;
  const [stats, recentComplaints, notifications] = await Promise.all([
    getCitizenComplaintStatsServer(uid),
    getRecentComplaintsServer(uid, 6),
    getCitizenNotificationsServer(uid, 5),
  ]);

  return (
    <div className="space-y-8 max-w-6xl">
      {success === 'complaint_submitted' && (
        <div className="rounded-sm border border-[#718267] bg-[#ECE9DF] p-4 text-sm text-[#1B3A2E] flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-[#2D5A3F] mt-0.5" />
          <div>
            <p className="font-semibold text-[#1B3A2E]">
              Grievance Submitted Successfully
              {ticket ? ` · Reference ${ticket}` : ''}
            </p>
            <p className="text-xs text-[#263D30] mt-0.5">
              Your report has been logged and routed to the municipal administration for verification.
              {ticket ? (
                <>
                  {' '}
                  <Link href={`/track?ticket=${encodeURIComponent(ticket)}`} className="underline font-medium">
                    View public tracker →
                  </Link>
                </>
              ) : null}
            </p>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#DDD9CE]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#718267]">
            Resident Dispatch Desk
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[#1B3A2E] mt-1">
            Welcome back, {session.displayName ?? session.email?.split('@')[0]}
          </h1>
          <p className="text-xs text-[#77796F] mt-1">
            Track filed reports and document new civic issues across your neighbourhood.
          </p>
        </div>
        <Link href="/citizen/report">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            <span>Report an Issue</span>
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
              <h2 className="font-serif text-xl font-semibold text-[#1B3A2E]">Recent Complaints</h2>
              <p className="text-xs text-[#77796F]">Issues you have reported across your ward</p>
            </div>
            <Link
              href="/citizen/complaints"
              className="text-xs font-medium text-[#1B3A2E] hover:underline flex items-center gap-1"
            >
              <span>View all ({stats.total})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentComplaints.length === 0 ? (
            <div className="bg-[#FAF8F2] border border-[#DDD9CE] rounded-sm p-8 text-center space-y-3">
              <FileText className="h-8 w-8 text-[#718267] mx-auto" />
              <div>
                <p className="font-serif text-base font-semibold text-[#252820]">No complaints filed yet</p>
                <p className="text-xs text-[#77796F] mt-1">
                  Spot a civic problem in your area? Report it directly to municipal officials.
                </p>
              </div>
              <Link href="/citizen/report">
                <Button size="sm" className="text-xs mt-2">
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
              <h2 className="font-serif text-xl font-semibold text-[#1B3A2E]">Recent Activity</h2>
              <p className="text-xs text-[#77796F]">Status updates &amp; alerts</p>
            </div>
            <Link
              href="/citizen/notifications"
              className="text-xs font-medium text-[#1B3A2E] hover:underline"
            >
              Inbox
            </Link>
          </div>

          {notifications.length === 0 ? (
            <div className="bg-[#FAF8F2] border border-[#DDD9CE] rounded-sm p-6 text-center text-xs text-[#77796F]">
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

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; ticket?: string }>;
}) {
  const { success, ticket } = await searchParams;
  return (
    <DashboardLayout>
      <Suspense fallback={<LoadingState message="Loading citizen dashboard..." />}>
        <DashboardContent success={success} ticket={ticket} />
      </Suspense>
    </DashboardLayout>
  );
}
