import { collection, doc, getDoc } from 'firebase/firestore';
import { getClientDb } from '@/lib/firebase/config';
import type { Complaint } from '@/types/complaint';

/** Get a single complaint by its ID (only if belongs to the citizen) */
export async function getComplaintById(complaintId: string) {
  const docRef = doc(getClientDb(), 'complaints', complaintId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  const complaint: Complaint = {
    id: snap.id,
    citizenId: data.citizenId,
    title: data.title,
    description: data.description,
    category: data.category,
    address: data.address,
    city: data.city,
    landmark: data.landmark,
    location: data.location,
    imageUrls: data.imageUrls,
    status: data.status,
    priority: data.priority,
    departmentId: data.departmentId,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
  return complaint;
}
