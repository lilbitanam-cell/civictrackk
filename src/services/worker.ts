import { collection, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp, Timestamp, setDoc, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getClientDb, getClientStorage } from '@/lib/firebase/config';
import type { WorkerTask } from '@/types/workerTask';
import type { Complaint } from '@/types/complaint';

/** Fetch task statistics for a given worker */
export async function getWorkerTaskStats(workerId: string) {
  const col = collection(getClientDb(), 'workerTasks');
  const q = query(col, where('workerId', '==', workerId));
  const snap = await getDocs(q);
  const total = snap.size;
  const statusCounts: Record<string, number> = {};
  snap.forEach((doc) => {
    const data = doc.data();
    const status = data.status as string;
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  return { total, statusCounts };
}

/** Fetch tasks assigned to a worker with optional filters */
export async function getWorkerTasks(
  workerId: string,
  filters?: { status?: string; priority?: string }
) {
  let q = query(collection(getClientDb(), 'workerTasks'), where('workerId', '==', workerId));
  if (filters?.status) {
    q = query(q, where('status', '==', filters.status));
  }
  if (filters?.priority) {
    q = query(q, where('priority', '==', filters.priority));
  }
  const snap = await getDocs(q);
  const tasks: WorkerTask[] = [];
  snap.forEach((doc) => {
    const d = doc.data();
    tasks.push({
      id: doc.id,
      complaintId: d.complaintId,
      workerId: d.workerId,
      title: d.title,
      category: d.category,
      priority: d.priority,
      address: d.address,
      city: d.city,
      landmark: d.landmark,
      location: d.location,
      status: d.status,
      assignmentDate: d.assignmentDate,
      remarks: d.remarks,
      beforeImages: d.beforeImages,
      afterImages: d.afterImages,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    });
  });
  return tasks;
}

/** Get a single task by its ID */
export async function getWorkerTaskById(taskId: string) {
  const snap = await getDoc(doc(getClientDb(), 'workerTasks', taskId));
  if (!snap.exists()) return null;
  const d = snap.data();
  const task: WorkerTask = {
    id: snap.id,
    complaintId: d.complaintId,
    workerId: d.workerId,
    title: d.title,
    category: d.category,
    priority: d.priority,
    address: d.address,
    city: d.city,
    landmark: d.landmark,
    location: d.location,
    status: d.status,
    assignmentDate: d.assignmentDate,
    remarks: d.remarks,
    beforeImages: d.beforeImages,
    afterImages: d.afterImages,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
  return task;
}

/** Update task status and optional fields */
export async function updateWorkerTask(
  taskId: string,
  updates: Partial<WorkerTask>
) {
  const taskRef = doc(getClientDb(), 'workerTasks', taskId);
  await updateDoc(taskRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/** Upload images for a task (before or after) */
export async function uploadTaskImages(
  workerId: string,
  taskId: string,
  files: File[],
  type: 'before' | 'after'
) {
  const storage = getClientStorage();
  const urls: string[] = [];
  for (const file of files) {
    const refPath = `workerTaskImages/${workerId}/${taskId}/${type}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, refPath);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);
    urls.push(url);
  }
  return urls;
}

/** Add an entry to the complaint history */
export async function addComplaintHistory(
  complaintId: string,
  entry: { action: string; by: string; note?: string; timestamp?: Timestamp }
) {
  const colRef = collection(getClientDb(), `complaints/${complaintId}/history`);
  await addDoc(colRef, {
    action: entry.action,
    by: entry.by,
    note: entry.note ?? null,
    timestamp: entry.timestamp ?? serverTimestamp(),
  });
}

/** Send a notification (to citizen or admin) */
export async function sendNotification(
  targetUid: string,
  payload: { title: string; message: string; complaintId?: string }
) {
  const notifCol = collection(getClientDb(), 'notifications');
  await addDoc(notifCol, {
    citizenId: targetUid,
    title: payload.title,
    message: payload.message,
    complaintId: payload.complaintId ?? null,
    createdAt: serverTimestamp(),
    read: false,
  });
}
