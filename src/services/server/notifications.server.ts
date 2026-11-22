import { getAdminDb } from "@/lib/firebase/admin";
import { NotificationDocument } from "@/types";

const COLLECTION_NAME = "notifications";

export async function sendNotificationServer(
  notification: Omit<NotificationDocument, "id" | "createdAt" | "isRead">
): Promise<string> {
  const db = getAdminDb();
  const docRef = await db.collection(COLLECTION_NAME).add({
    ...notification,
    isRead: false,
    createdAt: new Date(),
  });
  return docRef.id;
}
