/**
 * SERVER-ONLY Firestore helpers — use Firebase Admin SDK.
 * These run exclusively in Next.js Server Components and API Routes.
 * They bypass Firestore Security Rules (Admin SDK has full access).
 * Never import this file from a client component ("use client").
 */
import { getAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";

type FirestoreTimestamp = {
  toDate?: () => Date;
  seconds?: number;
  _seconds?: number;
};

function toDate(ts: FirestoreTimestamp | Date | string | undefined | null): Date | null {
  if (!ts) return null;
  if (ts instanceof Date) return ts;
  if (typeof ts === "string") {
    const d = new Date(ts);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof ts.toDate === "function") return ts.toDate();
  if (typeof ts.seconds === "number") return new Date(ts.seconds * 1000);
  if (typeof ts._seconds === "number") return new Date(ts._seconds * 1000);
  return null;
}

/**
 * Recursively convert Firestore Timestamps and Date objects into ISO strings
 * so records are 100% safe to pass from Server Components to Client Components.
 */
export function serializeFirestoreData<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) {
    return value.toISOString() as unknown as T;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.toDate === "function") {
      return (obj.toDate as () => Date)().toISOString() as unknown as T;
    }
    if (typeof obj._seconds === "number" && typeof obj._nanoseconds === "number") {
      return new Date(obj._seconds * 1000).toISOString() as unknown as T;
    }
    if (typeof obj.seconds === "number" && typeof obj.nanoseconds === "number") {
      return new Date(obj.seconds * 1000).toISOString() as unknown as T;
    }
    if (Array.isArray(value)) {
      return value.map((item) => serializeFirestoreData(item)) as unknown as T;
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = serializeFirestoreData(v);
    }
    return out as T;
  }
  return value;
}

function docToComplaint(id: string, data: FirebaseFirestore.DocumentData): any {
  const serialized = serializeFirestoreData(data);
  return {
    ...serialized,
    id,
    ticketNumber: serialized.ticketNumber ?? `#${id.slice(0, 8).toUpperCase()}`,
    citizenId: serialized.citizenId ?? "",
    title: serialized.title ?? "",
    description: serialized.description ?? "",
    category: serialized.category ?? "",
    categoryLabel: serialized.categoryLabel ?? serialized.category ?? "",
    address: serialized.address ?? serialized.location?.address ?? "",
    city: serialized.city ?? serialized.location?.city ?? "",
    landmark: serialized.landmark ?? serialized.location?.landmark ?? null,
    location: serialized.location ?? null,
    images: serialized.images ?? serialized.imageUrls ?? [],
    imageUrls: serialized.imageUrls ?? serialized.images ?? [],
    status: serialized.status ?? "submitted",
    priority: serialized.priority ?? "medium",
    departmentId: serialized.departmentId ?? null,
    createdAt: serialized.createdAt ?? null,
    updatedAt: serialized.updatedAt ?? null,
  };
}

function getTimeMs(val: unknown): number {
  const d = toDate(val as FirestoreTimestamp);
  return d ? d.getTime() : 0;
}

/** Complaint stats for a single citizen (server-side) */
export async function getCitizenComplaintStatsServer(citizenId: string) {
  const db = getAdminDb();
  const snap = await db
    .collection("complaints")
    .where("citizenId", "==", citizenId)
    .get();

  let total = 0,
    pending = 0,
    inProgress = 0,
    resolved = 0;
  snap.forEach((doc) => {
    total++;
    const status = doc.data().status as string;
    if (status === "pending" || status === "submitted" || status === "under_review") {
      pending++;
    } else if (
      status === "in_progress" ||
      status === "assigned" ||
      status === "resolution_submitted"
    ) {
      inProgress++;
    } else if (status === "resolved" || status === "closed") {
      resolved++;
    }
  });
  return { total, pending, inProgress, resolved };
}

/** Recent complaints for a citizen (server-side) */
export async function getRecentComplaintsServer(
  citizenId: string,
  limitN = 5
): Promise<any[]> {
  const db = getAdminDb();
  const snap = await db
    .collection("complaints")
    .where("citizenId", "==", citizenId)
    .get();

  const list = snap.docs.map((d) => docToComplaint(d.id, d.data()));
  list.sort((a, b) => getTimeMs(b.createdAt) - getTimeMs(a.createdAt));

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

  const list = snap.docs.map((d) => ({
    ...serializeFirestoreData(d.data()),
    id: d.id,
  }));
  list.sort((a: any, b: any) => getTimeMs(b.createdAt) - getTimeMs(a.createdAt));

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
    if (status) statusCounts[status] = (statusCounts[status] || 0) + 1;

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
export async function getRecentAdminComplaintsServer(limitN = 5): Promise<any[]> {
  const db = getAdminDb();
  const snap = await db
    .collection("complaints")
    .orderBy("createdAt", "desc")
    .limit(limitN)
    .get();

  return snap.docs.map((d) => docToComplaint(d.id, d.data()));
}

/** Admin: high-priority complaints (server-side) */
export async function getHighPriorityComplaintsServer(limitN = 5): Promise<any[]> {
  const db = getAdminDb();
  try {
    const snap = await db
      .collection("complaints")
      .where("priority", "==", "high")
      .orderBy("createdAt", "desc")
      .limit(limitN)
      .get();

    return snap.docs.map((d) => docToComplaint(d.id, d.data()));
  } catch (err: any) {
    if (err?.code === 9 || err?.message?.includes("requires an index")) {
      console.warn(
        "[Firestore] Composite index missing for complaints (priority == 'high', createdAt desc). Using fallback sort while index provisions."
      );
      const snap = await db
        .collection("complaints")
        .where("priority", "==", "high")
        .get();
      const list = snap.docs.map((d) => docToComplaint(d.id, d.data()));
      list.sort((a, b) => getTimeMs(b.createdAt) - getTimeMs(a.createdAt));
      return list.slice(0, limitN);
    }
    throw err;
  }
}

/** Get active departments (server-side) */
export async function getActiveDepartmentsServer(): Promise<any[]> {
  const db = getAdminDb();
  try {
    const snap = await db
      .collection("departments")
      .where("isActive", "==", true)
      .orderBy("name", "asc")
      .get();

    return snap.docs.map((d) => ({
      ...serializeFirestoreData(d.data()),
      id: d.id,
    }));
  } catch (err: any) {
    if (err?.code === 9 || err?.message?.includes("requires an index")) {
      console.warn(
        "[Firestore] Composite index missing for departments (isActive == true, name asc). Using fallback sort while index provisions."
      );
      const snap = await db
        .collection("departments")
        .where("isActive", "==", true)
        .get();
      const list = snap.docs.map((d) => ({
        ...serializeFirestoreData(d.data()),
        id: d.id,
      }));
      list.sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));
      return list;
    }
    throw err;
  }
}

/** Get complaints with optional filtering (admin server page) */
export async function getComplaintsServer(options: any = {}): Promise<any[]> {
  const db = getAdminDb();
  try {
    let ref: FirebaseFirestore.Query = db.collection("complaints");

    if (options.citizenId) ref = ref.where("citizenId", "==", options.citizenId);
    if (options.departmentId) ref = ref.where("departmentId", "==", options.departmentId);
    if (options.assignedWorkerId)
      ref = ref.where("assignedWorkerId", "==", options.assignedWorkerId);
    if (options.status) ref = ref.where("status", "==", options.status);
    if (options.category) ref = ref.where("category", "==", options.category);

    ref = ref.orderBy("createdAt", "desc");
    if (options.maxResults) ref = ref.limit(options.maxResults);

    const snap = await ref.get();
    return snap.docs.map((d) => docToComplaint(d.id, d.data()));
  } catch (err: any) {
    if (err?.code === 9 || err?.message?.includes("requires an index")) {
      console.warn(
        "[Firestore] Composite index missing for getComplaintsServer. Using fallback sort while index provisions."
      );
      let ref: FirebaseFirestore.Query = db.collection("complaints");

      if (options.citizenId) ref = ref.where("citizenId", "==", options.citizenId);
      if (options.departmentId) ref = ref.where("departmentId", "==", options.departmentId);
      if (options.assignedWorkerId)
        ref = ref.where("assignedWorkerId", "==", options.assignedWorkerId);
      if (options.status) ref = ref.where("status", "==", options.status);
      if (options.category) ref = ref.where("category", "==", options.category);

      const snap = await ref.get();
      const list = snap.docs.map((d) => docToComplaint(d.id, d.data()));
      list.sort((a, b) => getTimeMs(b.createdAt) - getTimeMs(a.createdAt));
      return options.maxResults ? list.slice(0, options.maxResults) : list;
    }
    throw err;
  }
}

/** Get all complaints for a citizen (full ComplaintDocument list for server pages) */
export async function getComplaintsByCitizenServer(citizenId: string): Promise<any[]> {
  const db = getAdminDb();
  const snap = await db
    .collection("complaints")
    .where("citizenId", "==", citizenId)
    .get();

  const list = snap.docs.map((d) => docToComplaint(d.id, d.data()));
  list.sort((a, b) => getTimeMs(b.createdAt) - getTimeMs(a.createdAt));
  return list;
}

/** Get a single complaint by ID (server-side, full document) */
export async function getComplaintDocumentByIdServer(
  complaintId: string
): Promise<any | null> {
  const db = getAdminDb();
  const snap = await db.collection("complaints").doc(complaintId).get();
  if (!snap.exists) return null;
  return docToComplaint(snap.id, snap.data()!);
}

/** Get complaint history (server-side) */
export async function getComplaintHistoryServer(complaintId: string): Promise<any[]> {
  const db = getAdminDb();
  try {
    const snap = await db
      .collection("complaintHistory")
      .where("complaintId", "==", complaintId)
      .orderBy("createdAt", "asc")
      .get();

    return snap.docs.map((d) => ({
      ...serializeFirestoreData(d.data()),
      id: d.id,
    }));
  } catch (err: any) {
    if (err?.code === 9 || err?.message?.includes("requires an index")) {
      console.warn(
        "[Firestore] Composite index missing for complaintHistory (complaintId == id, createdAt asc). Using fallback sort while index provisions."
      );
      const snap = await db
        .collection("complaintHistory")
        .where("complaintId", "==", complaintId)
        .get();
      const list = snap.docs.map((d) => ({
        ...serializeFirestoreData(d.data()),
        id: d.id,
      }));
      list.sort((a: any, b: any) => getTimeMs(a.createdAt) - getTimeMs(b.createdAt));
      return list;
    }
    throw err;
  }
}

export interface PublicCivicStory {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: string;
  categoryLabel: string;
  status: string;
  priority: string;
  departmentName: string | null;
  location: {
    address: string;
    city?: string;
    landmark?: string;
  } | null;
  images: string[];
  resolutionImages: string[];
  resolutionNotes: string | null;
  adminRemarks: string | null;
  rejectionReason: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  resolvedAt: string | null;
}

function toPublicStory(id: string, raw: FirebaseFirestore.DocumentData): PublicCivicStory {
  const s = serializeFirestoreData(raw);
  const loc = s.location && typeof s.location === "object"
    ? {
        address: String(s.location.address || s.address || "Municipal Ward"),
        ...(s.location.city ? { city: String(s.location.city) } : {}),
        ...(s.location.landmark ? { landmark: String(s.location.landmark) } : {}),
      }
    : s.address
    ? { address: String(s.address), ...(s.city ? { city: String(s.city) } : {}) }
    : null;

  return {
    id,
    ticketNumber: String(s.ticketNumber || `#${id.slice(0, 8).toUpperCase()}`),
    title: String(s.title || "Municipal Issue"),
    description: String(s.description || ""),
    category: String(s.category || "other"),
    categoryLabel: String(s.categoryLabel || s.category || "Civic Issue"),
    status: String(s.status || "submitted"),
    priority: String(s.priority || "medium"),
    departmentName: s.departmentName ? String(s.departmentName) : null,
    location: loc,
    images: Array.isArray(s.images) ? s.images : Array.isArray(s.imageUrls) ? s.imageUrls : [],
    resolutionImages: Array.isArray(s.resolutionImages) ? s.resolutionImages : [],
    resolutionNotes: s.resolutionNotes ? String(s.resolutionNotes) : null,
    adminRemarks: s.adminRemarks ? String(s.adminRemarks) : null,
    rejectionReason: s.rejectionReason ? String(s.rejectionReason) : null,
    createdAt: s.createdAt ?? null,
    updatedAt: s.updatedAt ?? null,
    resolvedAt: s.resolvedAt ?? null,
  };
}

/** Public live stats + featured/recent stories for the editorial homepage (no PII). */
export async function getPublicCivicJournalDataServer() {
  if (!isFirebaseAdminConfigured()) {
    return {
      stats: { total: 0, active: 0, resolved: 0, resolutionRate: 0, departmentsCount: 0 },
      featuredStories: [] as PublicCivicStory[],
      recentReported: [] as PublicCivicStory[],
      recentResolved: [] as PublicCivicStory[],
    };
  }

  try {
    const db = getAdminDb();
    const [compSnap, deptSnap] = await Promise.all([
      db.collection("complaints").get(),
      db.collection("departments").where("isActive", "==", true).get(),
    ]);

    const all = compSnap.docs.map((d) => toPublicStory(d.id, d.data()));
    all.sort((a, b) => getTimeMs(b.createdAt) - getTimeMs(a.createdAt));

    const total = all.length;
    const resolvedList = all.filter((c) => c.status === "resolved" || c.status === "closed");
    const activeCount = all.filter((c) =>
      ["submitted", "under_review", "assigned", "in_progress", "resolution_submitted"].includes(
        c.status
      )
    ).length;

    const resolutionRate = total > 0 ? Math.round((resolvedList.length / total) * 100) : 0;

    // Featured stories prioritize documented reports with photos or resolutions
    const scored = [...all].sort((a, b) => {
      const scoreA =
        (a.resolutionImages.length > 0 ? 4 : 0) +
        (a.images.length > 0 ? 3 : 0) +
        (a.status === "resolved" || a.status === "closed" ? 2 : 0);
      const scoreB =
        (b.resolutionImages.length > 0 ? 4 : 0) +
        (b.images.length > 0 ? 3 : 0) +
        (b.status === "resolved" || b.status === "closed" ? 2 : 0);
      if (scoreB !== scoreA) return scoreB - scoreA;
      return getTimeMs(b.createdAt) - getTimeMs(a.createdAt);
    });

    return {
      stats: {
        total,
        active: activeCount,
        resolved: resolvedList.length,
        resolutionRate,
        departmentsCount: deptSnap.size,
      },
      featuredStories: scored.slice(0, 3),
      recentReported: all.slice(0, 4),
      recentResolved: resolvedList.slice(0, 4),
    };
  } catch (err) {
    console.error("getPublicCivicJournalDataServer error:", err);
    return {
      stats: { total: 0, active: 0, resolved: 0, resolutionRate: 0, departmentsCount: 0 },
      featuredStories: [] as PublicCivicStory[],
      recentReported: [] as PublicCivicStory[],
      recentResolved: [] as PublicCivicStory[],
    };
  }
}

/** Public list of sanitized civic stories for /stories */
export async function getPublicCivicStoriesServer(limitN = 30): Promise<PublicCivicStory[]> {
  if (!isFirebaseAdminConfigured()) return [];
  try {
    const db = getAdminDb();
    const snap = await db.collection("complaints").get();
    const list = snap.docs.map((d) => toPublicStory(d.id, d.data()));
    list.sort((a, b) => getTimeMs(b.createdAt) - getTimeMs(a.createdAt));
    return list.slice(0, limitN);
  } catch (err) {
    console.error("getPublicCivicStoriesServer error:", err);
    return [];
  }
}

/** Public sanitized single story + timeline for /stories/[id] or /track */
export async function getPublicCivicStoryDetailServer(
  complaintIdOrTicket: string,
  byTicket = false
): Promise<{
  story: PublicCivicStory;
  timeline: Array<{
    id: string;
    action: string;
    actorRole: string;
    previousStatus?: string;
    newStatus?: string;
    notes?: string;
    createdAt: string | null;
  }>;
} | null> {
  if (!isFirebaseAdminConfigured()) return null;
  const db = getAdminDb();

  let docSnap: FirebaseFirestore.DocumentSnapshot | null = null;
  if (byTicket) {
    const cleanTicket = complaintIdOrTicket.trim().toUpperCase();
    const q = await db
      .collection("complaints")
      .where("ticketNumber", "==", cleanTicket)
      .limit(1)
      .get();
    if (!q.empty) docSnap = q.docs[0];
  } else {
    const snap = await db.collection("complaints").doc(complaintIdOrTicket).get();
    if (snap.exists) docSnap = snap;
  }

  if (!docSnap || !docSnap.exists) return null;

  const story = toPublicStory(docSnap.id, docSnap.data()!);
  const rawHistory = await getComplaintHistoryServer(docSnap.id);

  const timeline = rawHistory.map((entry: any) => ({
    id: String(entry.id),
    action: String(entry.action || "status_changed"),
    actorRole: String(entry.actorRole || "system"),
    ...(entry.previousStatus ? { previousStatus: String(entry.previousStatus) } : {}),
    ...(entry.newStatus ? { newStatus: String(entry.newStatus) } : {}),
    ...(entry.notes ? { notes: String(entry.notes) } : {}),
    createdAt: entry.createdAt ?? null,
  }));

  return { story, timeline };
}
