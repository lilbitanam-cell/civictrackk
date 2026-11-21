import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { getClientDb } from '@/lib/firebase/config';
import type { Complaint } from '@/types/complaint';

/** Fetch the full history timeline for a complaint */
export async function getComplaintHistory(complaintId: string) {
  const col = collection(getClientDb(), `complaints/${complaintId}/history`);
  const q = query(col, orderBy('timestamp', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
