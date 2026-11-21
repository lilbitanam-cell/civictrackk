import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { getTasksByWorkerServer as getTasksByWorker } from "@/services/server/tasks.server";
import WorkerLayout from "@/components/worker/WorkerLayout";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import WorkerTasksClient from "./WorkerTasksClient";

async function Content() {
  const session = await getCurrentSession();
  if (!session || session.role !== "worker") redirect("/unauthorized?reason=worker_required");
  const tasks = await getTasksByWorker(session.uid);
  return <WorkerTasksClient tasks={tasks} />;
}

export default function WorkerTasksPage() {
  return (
    <WorkerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#30352D]">My Tasks</h1>
          <p className="text-sm text-[#74796F] mt-1">All tasks assigned to you.</p>
        </div>
        <Suspense fallback={<LoadingState message="Loading tasks..." />}>
          <Content />
        </Suspense>
      </div>
    </WorkerLayout>
  );
}
