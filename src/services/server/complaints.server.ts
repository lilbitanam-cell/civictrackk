/**
 * SERVER-ONLY Firestore helpers — use Firebase Admin SDK.
 * These run exclusively in Next.js Server Components and API Routes.
 * They bypass Firestore Security Rules (Admin SDK has full access).
 * Never import this file from a client component ("use client").
 */
import { getAdminDb } from "@/lib/firebase/admin";
import type { Complaint } from "@/types/complaint";

type FirestoreTimestamp = { toDate?: () => Date; seconds?: number };

function toDate(ts: FirestoreTimestamp | undefined | null): Date | null {
  if (!ts) return null;
  if (typeof ts.toDate === "function") return ts.toDate();
  if (ts.seconds) return new Date(ts.seconds * 1000);
  return null;
}

function docToComplaint(id: string, data: FirebaseFirestore.DocumentData): Complaint {
  return {
    id,
    citizenId: data.citizenId ?? "",
    title: data.title ?? "",
    description: data.description ?? "",
    category: data.category ?? "",
    address: data.address ?? "",
    city: data.city ?? "",
    landmark: data.landmark ?? null,
    location: data.location ?? null,
    imageUrls: data.imageUrls ?? [],
    status: data.status ?? "pending",
    priority: data.priority ?? null,
    departmentId: data.departmentId ?? null,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

/** Complaint stats for a single citizen (server-side) */
export async function getCitizenComplaintStatsServer(citizenId: string) {
  const db = getAdminDb();
  const snap = await db
    .collection("complaints")
    .where("citizenId", "==", citizenId)
    .get();

  let total = 0, pending = 0, inProgress = 0, resolved = 0;
  snap.forEach((doc) => {
    total++;
    const status = doc.data().status as string;
    if (status === "pending" || status === "submitted" || status === "under_review") pending++;
    else if (status === "in_progress" || status === "assigned") inProgress++;
    else if (status === "resolved" || status === "closed") resolved++;
  });
  return { total, pending, inProgress, resolved };
}

/** Recent complaints for a citizen (server-side) */
export async function getRecentComplaintsServer(
  citizenId: string,
  limitN = 5
): Promise<Complaint[]> {
  const db = getAdminDb();
  const snap = await db
    .collection("complaints")
    .where("citizenId", "==", citizenId)
    .get();

  const list = snap.docs.map((d) => docToComplaint(d.id, d.data()));
  // Sort in-memory by createdAt descending so no composite index is required
  list.sort((a, b) => {
    const tA = (a.createdAt as any)?.seconds ? (a.createdAt as any).seconds * 1000 : new Date(a.createdAt || 0).getTime();
    const tB = (b.createdAt as any)?.seconds ? (b.createdAt as any).seconds * 1000 : new Date(b.createdAt || 0).getTime();
    return tB - tA;
  });

  return list.slice(0, limitN);
}

/** Notifications for a citizen (server-side) */
export async function getCitizenNotificationsServer(
  citizenId: string,
  limitN = 50
): Promise<any[]> {
  const db = getAdminDb();
  let snap = await db
    .collection("notifications")
    .where("userId", "==", citizenId)
    .get();

  if (snap.empty) {
    snap = await db
      .collection("notifications")
      .where("citizenId", "==", citizenId)
      .get();
  }

  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  list.sort((a: any, b: any) => {
    const tA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
    const tB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
    return tB - tA;
  });

  return list.slice(0, limitN);
}

/** Admin: overall complaint statistics (server-side) */
export async function getAdminComplaintStatsServer() {
  const db = getAdminDb();
  const snap = await db.collection("complaints").get();

  const total = snap.size;
  const statusCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  const priorityCounts: Record<string, number> = {};
  const monthly: Record<string, number> = {};

  snap.forEach((doc) => {
    const data = doc.data();
    const status = data.status as string;
    statusCounts[status] = (statusCounts[status] || 0) + 1;

    const cat = data.category as string;
    if (cat) categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

    const prio = data.priority as string;
    if (prio) priorityCounts[prio] = (priorityCounts[prio] || 0) + 1;

    const d = toDate(data.createdAt);
    if (d) {
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      monthly[key] = (monthly[key] || 0) + 1;
    }
  });

  const monthlyArray = Object.entries(monthly)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { total, statusCounts, categoryCounts, priorityCounts, monthlyArray };
}

/** Admin: recent complaints (server-side) */
export async function getRecentAdminComplaintsServer(limitN = 5): Promise<Complaint[]> {
  const db = getAdminDb();
  const snap = await db
    .collection("complaints")
    .orderBy("createdAt", "desc")
    .limit(limitN)
    .get();

  return snap.docs.map((d) => docToComplaint(d.id, d.data()));
}

/** Admin: high-priority complaints (server-side) */
export async function getHighPriorityComplaintsServer(limitN = 5): Promise<Complaint[]> {
  const db = getAdminDb();
  const snap = await db
    .collection("complaints")
    .where("priority", "==", "high")
    .orderBy("createdAt", "desc")
    .limit(limitN)
    .get();

  return snap.docs.map((d) => docToComplaint(d.id, d.data()));
}

/** Get active departments (server-side) */
export async function getActiveDepartmentsServer(): Promise<any[]> {
  const db = getAdminDb();
  const snap = await db
    .collection("departments")
    .where("isActive", "==", true)
    .orderBy("name", "asc")
    .get();

  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Get complaints with optional filtering (admin server page) */
export async function getComplaintsServer(options: any = {}): Promise<any[]> {
  const db = getAdminDb();
  let ref: FirebaseFirestore.Query = db.collection("complaints");

  if (options.citizenId) ref = ref.where("citizenId", "==", options.citizenId);
  if (options.departmentId) ref = ref.where("departmentId", "==", options.departmentId);
  if (options.assignedWorkerId) ref = ref.where("assignedWorkerId", "==", options.assignedWorkerId);
  if (options.status) ref = ref.where("status", "==", options.status);
  if (options.category) ref = ref.where("category", "==", options.category);

  ref = ref.orderBy("createdAt", "desc");
  if (options.maxResults) ref = ref.limit(options.maxResults);

  const snap = await ref.get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Get all complaints for a citizen (full ComplaintDocument list for server pages) */
export async function getComplaintsByCitizenServer(citizenId: string): Promise<any[]> {
  const db = getAdminDb();
  const snap = await db
    .collection("complaints")
    .where("citizenId", "==", citizenId)
    .get();

  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  list.sort((a: any, b: any) => {
    const tA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
    const tB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
    return tB - tA;
  });
  return list;
}

/** Get a single complaint by ID (server-side, full document) */
export async function getComplaintDocumentByIdServer(complaintId: string): Promise<any | null> {
  const db = getAdminDb();
  const snap = await db.collection("complaints").doc(complaintId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}

/** Get complaint history (server-side) */
export async function getComplaintHistoryServer(complaintId: string): Promise<any[]> {
  const db = getAdminDb();
  const snap = await db
    .collection("complaintHistory")
    .where("complaintId", "==", complaintId)
    .orderBy("createdAt", "asc")
    .get();

  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

