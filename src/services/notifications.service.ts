import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/config";
import { NotificationDocument } from "@/types";

const COLLECTION_NAME = "notifications";

export async function getUserNotifications(
  userId: string,
  maxResults = 20
): Promise<NotificationDocument[]> {
  const db = getClientDb();
  const notifRef = collection(db, COLLECTION_NAME);

  const q = query(
    notifRef,
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(maxResults)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (d) => ({ id: d.id, ...d.data() } as NotificationDocument)
  );
}

export async function markNotificationAsRead(
  notificationId: string
): Promise<void> {
  const db = getClientDb();
  const docRef = doc(db, COLLECTION_NAME, notificationId);

  await updateDoc(docRef, {
    isRead: true,
  });
}

export async function sendNotification(
  notification: Omit<NotificationDocument, "id" | "createdAt" | "isRead">
): Promise<string> {
  const db = getClientDb();
  const notifRef = collection(db, COLLECTION_NAME);

  const docRef = await addDoc(notifRef, {
    ...notification,
    isRead: false,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}
