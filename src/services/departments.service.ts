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
} from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/config";
import { DepartmentDocument } from "@/types";

const COLLECTION_NAME = "departments";

export async function getAllDepartments(): Promise<DepartmentDocument[]> {
  const db = getClientDb();
  const deptRef = collection(db, COLLECTION_NAME);
  const q = query(deptRef, orderBy("name", "asc"));

  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (d) => ({ id: d.id, ...d.data() } as DepartmentDocument)
  );
}

export async function getActiveDepartments(): Promise<DepartmentDocument[]> {
  const db = getClientDb();
  const deptRef = collection(db, COLLECTION_NAME);
  const q = query(
    deptRef,
    where("isActive", "==", true),
    orderBy("name", "asc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (d) => ({ id: d.id, ...d.data() } as DepartmentDocument)
  );
}

export async function getDepartmentById(
  departmentId: string
): Promise<DepartmentDocument | null> {
  const db = getClientDb();
  const docRef = doc(db, COLLECTION_NAME, departmentId);
  const snap = await getDoc(docRef);

  if (!snap.exists()) {
    return null;
  }

  return { id: snap.id, ...snap.data() } as DepartmentDocument;
}

export async function createDepartment(
  dept: Omit<DepartmentDocument, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const db = getClientDb();
  const deptRef = collection(db, COLLECTION_NAME);

  const docRef = await addDoc(deptRef, {
    ...dept,
    activeWorkersCount: dept.activeWorkersCount || 0,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateDepartment(
  departmentId: string,
  data: Partial<Omit<DepartmentDocument, "id" | "createdAt">>
): Promise<void> {
  const db = getClientDb();
  const docRef = doc(db, COLLECTION_NAME, departmentId);

  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}
