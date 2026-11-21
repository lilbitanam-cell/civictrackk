import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  QueryConstraint,
} from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/config";
import { WorkerTaskDocument, TaskStatus, ComplaintStatus } from "@/types";
import { updateComplaintStatus } from "./complaints.service";
import { logComplaintHistory } from "./history.service";

const COLLECTION_NAME = "workerTasks";

export async function getTasksByWorker(
  workerId: string,
  status?: TaskStatus
): Promise<WorkerTaskDocument[]> {
  const db = getClientDb();
  const tasksRef = collection(db, COLLECTION_NAME);

  const constraints: QueryConstraint[] = [where("workerId", "==", workerId)];
  if (status) {
    constraints.push(where("status", "==", status));
  }
  constraints.push(orderBy("createdAt", "desc"));

  const q = query(tasksRef, ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (d) => ({ id: d.id, ...d.data() } as WorkerTaskDocument)
  );
}

export async function getTaskById(
  taskId: string
): Promise<WorkerTaskDocument | null> {
  const db = getClientDb();
  const docRef = doc(db, COLLECTION_NAME, taskId);
  const snap = await getDoc(docRef);

  if (!snap.exists()) {
    return null;
  }

  return { id: snap.id, ...snap.data() } as WorkerTaskDocument;
}

export async function createWorkerTask(
  task: Omit<WorkerTaskDocument, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const db = getClientDb();
  const tasksRef = collection(db, COLLECTION_NAME);

  const docRef = await addDoc(tasksRef, {
    ...task,
    status: "pending" as TaskStatus,
    evidenceImages: task.evidenceImages || [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Also update complaint assignment and history
  const complaintDocRef = doc(db, "complaints", task.complaintId);
  await updateDoc(complaintDocRef, {
    assignedWorkerId: task.workerId,
    assignedWorkerName: task.workerName,
    status: "assigned" as ComplaintStatus,
    assignedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await logComplaintHistory({
    complaintId: task.complaintId,
    actorId: task.assignedByUserId,
    actorName: task.assignedByUserName,
    actorRole: "admin",
    action: "worker_assigned",
    notes: `Assigned to field worker ${task.workerName}.`,
  });

  return docRef.id;
}

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  evidence?: {
    images?: string[];
    notes?: string;
    workerId: string;
    workerName: string;
  }
): Promise<void> {
  const db = getClientDb();
  const docRef = doc(db, COLLECTION_NAME, taskId);

  const currentSnap = await getDoc(docRef);
  if (!currentSnap.exists()) {
    throw new Error(`Worker task with ID ${taskId} not found.`);
  }

  const taskData = currentSnap.data() as WorkerTaskDocument;

  const updates: Record<string, unknown> = {
    status,
    updatedAt: serverTimestamp(),
  };

  if (status === "in_progress") {
    updates.startedAt = serverTimestamp();
    // Mirror on complaint
    await updateComplaintStatus(
      taskData.complaintId,
      "in_progress",
      { id: evidence?.workerId || taskData.workerId, name: evidence?.workerName || taskData.workerName, role: "worker" },
      "Field work started."
    );
  } else if (status === "completed") {
    updates.completedAt = serverTimestamp();
    if (evidence?.images) {
      updates.evidenceImages = evidence.images;
    }
    if (evidence?.notes) {
      updates.evidenceNotes = evidence.notes;
    }

    // Mirror on complaint: status -> resolution_submitted (admin must approve)
    await updateComplaintStatus(
      taskData.complaintId,
      "resolution_submitted" as any,
      { id: evidence?.workerId || taskData.workerId, name: evidence?.workerName || taskData.workerName, role: "worker" },
      evidence?.notes || "Worker submitted resolution for admin verification."
    );

    // Save resolution images on complaint
    if (evidence?.images && evidence.images.length > 0) {
      const complaintDocRef = doc(db, "complaints", taskData.complaintId);
      await updateDoc(complaintDocRef, {
        resolutionImages: evidence.images,
      });
    }
  }

  await updateDoc(docRef, updates);
}
