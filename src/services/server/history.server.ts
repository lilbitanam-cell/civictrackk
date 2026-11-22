import { getAdminDb } from "@/lib/firebase/admin";
import { ComplaintHistoryDocument } from "@/types";

const COLLECTION_NAME = "complaintHistory";

export async function logComplaintHistoryServer(
  entry: Omit<ComplaintHistoryDocument, "id" | "createdAt">
): Promise<string> {
  const db = getAdminDb();
  const docRef = await db.collection(COLLECTION_NAME).add({
    ...entry,
    createdAt: new Date(),
  });
  return docRef.id;
}
