import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/config";
import { UserDocument, UserRole } from "@/types";

const COLLECTION_NAME = "users";

export async function getUserProfile(userId: string): Promise<UserDocument | null> {
  const db = getClientDb();
  const userRef = doc(db, COLLECTION_NAME, userId);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    return null;
  }

  return { id: snap.id, ...snap.data() } as UserDocument;
}

export async function createUserProfile(
  userData: Omit<UserDocument, "createdAt" | "updatedAt">
): Promise<void> {
  const db = getClientDb();
  const userRef = doc(db, COLLECTION_NAME, userData.id);

  await setDoc(userRef, {
    ...userData,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<UserDocument, "id" | "role" | "createdAt">>
): Promise<void> {
  const db = getClientDb();
  const userRef = doc(db, COLLECTION_NAME, userId);

  await updateDoc(userRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function getWorkersByDepartment(
  departmentId: string
): Promise<UserDocument[]> {
  const db = getClientDb();
  const usersRef = collection(db, COLLECTION_NAME);
  const q = query(
    usersRef,
    where("role", "==", "worker"),
    where("departmentId", "==", departmentId),
    where("isActive", "==", true)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as UserDocument));
}

export async function getUsersByRole(role: UserRole): Promise<UserDocument[]> {
  const db = getClientDb();
  const usersRef = collection(db, COLLECTION_NAME);
  const q = query(usersRef, where("role", "==", role), where("isActive", "==", true));

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as UserDocument));
}
