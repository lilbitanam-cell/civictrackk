import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/config";
import { ComplaintHistoryDocument } from "@/types";

const COLLECTION_NAME = "complaintHistory";

export async function getComplaintHistory(
  complaintId: string
): Promise<ComplaintHistoryDocument[]> {
  const db = getClientDb();
  const historyRef = collection(db, COLLECTION_NAME);
  const q = query(
    historyRef,
    where("complaintId", "==", complaintId),
    orderBy("createdAt", "asc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (d) => ({ id: d.id, ...d.data() } as ComplaintHistoryDocument)
  );
}

export async function logComplaintHistory(
  entry: Omit<ComplaintHistoryDocument, "id" | "createdAt">
): Promise<string> {
  const db = getClientDb();
  const historyRef = collection(db, COLLECTION_NAME);

  const docRef = await addDoc(historyRef, {
    ...entry,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}
