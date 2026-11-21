/**
 * SERVER-ONLY task helpers — Firebase Admin SDK.
 * Use in Server Components and API Routes only.
 */
import { getAdminDb } from "@/lib/firebase/admin";
import type { WorkerTaskDocument } from "@/types";

function docToTask(id: string, data: FirebaseFirestore.DocumentData): WorkerTaskDocument {
  return { id, ...data } as WorkerTaskDocument;
}

/** Get tasks assigned to a specific worker (server-side) */
export async function getTasksByWorkerServer(
  workerId: string,
  status?: string
): Promise<WorkerTaskDocument[]> {
  const db = getAdminDb();
  let ref: FirebaseFirestore.Query = db
    .collection("workerTasks")
    .where("workerId", "==", workerId);

  if (status) {
    ref = ref.where("status", "==", status);
  }

  const snap = await ref.get();
  const list = snap.docs.map((d) => docToTask(d.id, d.data()));
  list.sort((a: any, b: any) => {
    const tA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
    const tB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
    return tB - tA;
  });
  return list;
}

/** Get a single task by ID (server-side) */
export async function getTaskByIdServer(taskId: string): Promise<WorkerTaskDocument | null> {
  const db = getAdminDb();
  const snap = await db.collection("workerTasks").doc(taskId).get();
  if (!snap.exists) return null;
  return docToTask(snap.id, snap.data()!);
}
