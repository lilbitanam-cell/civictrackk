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
  limit,
  serverTimestamp,
  QueryConstraint,
} from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/config";
import {
  ComplaintDocument,
  ComplaintStatus,
  ComplaintCategory,
  UserRole,
} from "@/types";
import { logComplaintHistory } from "./history.service";

const COLLECTION_NAME = "complaints";

export interface ComplaintFilterOptions {
  citizenId?: string;
  departmentId?: string;
  assignedWorkerId?: string;
  status?: ComplaintStatus;
  category?: ComplaintCategory;
  maxResults?: number;
}

/**
 * Generates an official, human-readable ticket number.
 * Format: CT-YYYYMM-XXXX
 */
function generateTicketNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `CT-${year}${month}-${random}`;
}

export async function getComplaintById(
  complaintId: string
): Promise<ComplaintDocument | null> {
  const db = getClientDb();
  const docRef = doc(db, COLLECTION_NAME, complaintId);
  const snap = await getDoc(docRef);

  if (!snap.exists()) {
    return null;
  }

  return { id: snap.id, ...snap.data() } as ComplaintDocument;
}

export async function getComplaintsByCitizen(
  citizenId: string
): Promise<ComplaintDocument[]> {
  const db = getClientDb();
  const complaintsRef = collection(db, COLLECTION_NAME);
  const q = query(
    complaintsRef,
    where("citizenId", "==", citizenId),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (d) => ({ id: d.id, ...d.data() } as ComplaintDocument)
  );
}

export async function getComplaints(
  options: ComplaintFilterOptions = {}
): Promise<ComplaintDocument[]> {
  const db = getClientDb();
  const complaintsRef = collection(db, COLLECTION_NAME);

  const constraints: QueryConstraint[] = [];

  if (options.citizenId) {
    constraints.push(where("citizenId", "==", options.citizenId));
  }
  if (options.departmentId) {
    constraints.push(where("departmentId", "==", options.departmentId));
  }
  if (options.assignedWorkerId) {
    constraints.push(where("assignedWorkerId", "==", options.assignedWorkerId));
  }
  if (options.status) {
    constraints.push(where("status", "==", options.status));
  }
  if (options.category) {
    constraints.push(where("category", "==", options.category));
  }

  constraints.push(orderBy("createdAt", "desc"));

  if (options.maxResults) {
    constraints.push(limit(options.maxResults));
  }

  const q = query(complaintsRef, ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (d) => ({ id: d.id, ...d.data() } as ComplaintDocument)
  );
}

export async function createComplaint(
  data: Omit<
    ComplaintDocument,
    | "id"
    | "ticketNumber"
    | "status"
    | "upvotesCount"
    | "commentsCount"
    | "createdAt"
    | "updatedAt"
  >
): Promise<string> {
  const db = getClientDb();
  const complaintsRef = collection(db, COLLECTION_NAME);

  const ticketNumber = generateTicketNumber();

  const docRef = await addDoc(complaintsRef, {
    ...data,
    ticketNumber,
    status: "submitted" as ComplaintStatus,
    upvotesCount: 0,
    commentsCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Automatically log audit trail entry
  await logComplaintHistory({
    complaintId: docRef.id,
    actorId: data.citizenId,
    actorName: data.citizenName,
    actorRole: "citizen",
    action: "submitted",
    newStatus: "submitted",
    notes: `Complaint filed under ticket ${ticketNumber}.`,
  });

  return docRef.id;
}

export async function updateComplaintStatus(
  complaintId: string,
  newStatus: ComplaintStatus,
  actor: { id: string; name: string; role: UserRole },
  notes?: string
): Promise<void> {
  const db = getClientDb();
  const docRef = doc(db, COLLECTION_NAME, complaintId);

  const currentSnap = await getDoc(docRef);
  const previousStatus = currentSnap.data()?.status as ComplaintStatus | undefined;

  const updates: Record<string, unknown> = {
    status: newStatus,
    updatedAt: serverTimestamp(),
  };

  if (newStatus === "resolved") {
    updates.resolvedAt = serverTimestamp();
    if (notes) updates.resolutionNotes = notes;
  } else if (newStatus === "closed") {
    updates.closedAt = serverTimestamp();
  }

  await updateDoc(docRef, updates);

  await logComplaintHistory({
    complaintId,
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: "status_changed",
    previousStatus,
    newStatus,
    notes,
  });
}

export async function assignComplaintDepartment(
  complaintId: string,
  departmentId: string,
  departmentName: string,
  actor: { id: string; name: string; role: UserRole }
): Promise<void> {
  const db = getClientDb();
  const docRef = doc(db, COLLECTION_NAME, complaintId);

  await updateDoc(docRef, {
    departmentId,
    departmentName,
    status: "under_review",
    updatedAt: serverTimestamp(),
  });

  await logComplaintHistory({
    complaintId,
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: "department_assigned",
    notes: `Assigned to ${departmentName}.`,
  });
}
