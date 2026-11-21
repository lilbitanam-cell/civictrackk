import { getClientDb, getClientStorage } from '@/lib/firebase/config';
import { collection, addDoc, query, where, getDocs, orderBy, limit, doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { Complaint } from '@/types/complaint';

// Firestore collection references
const complaintsCol = () => collection(getClientDb(), 'complaints');
const complaintHistoryCol = (complaintId: string) => collection(getClientDb(), `complaints/${complaintId}/history`);

/** Create a new complaint for a citizen */
export async function createComplaint(citizenId: string, data: Omit<Complaint, 'id' | 'citizenId' | 'status' | 'createdAt' | 'imageUrls'> & { images: File[] }) {
  // Upload images first
  const storage = getClientStorage();
  const imageUrls: string[] = [];
  for (const file of data.images) {
    const storageRef = ref(storage, `complaintImages/${citizenId}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);
    imageUrls.push(url);
  }

  const complaintDoc = await addDoc(complaintsCol(), {
    citizenId,
    title: data.title,
    description: data.description,
    category: data.category,
    address: data.address,
    city: data.city,
    landmark: data.landmark ?? null,
    location: data.location,
    imageUrls,
    status: 'pending',
    priority: data.priority ?? null,
    departmentId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Create initial history entry
  const historyRef = doc(complaintHistoryCol(complaintDoc.id));
  await setDoc(historyRef, {
    timestamp: serverTimestamp(),
    action: 'created',
    by: citizenId,
    note: 'Complaint submitted',
  });

  return complaintDoc.id;
}

/** Get complaint counts for a citizen */
export async function getCitizenComplaintStats(citizenId: string) {
  const q = query(complaintsCol(), where('citizenId', '==', citizenId));
  const snap = await getDocs(q);
  const total = snap.size;
  let pending = 0,
    inProgress = 0,
    resolved = 0;
  snap.forEach((doc) => {
    const status = doc.data().status as string;
    if (status === 'pending') pending++;
    else if (status === 'in-progress') inProgress++;
    else if (status === 'resolved') resolved++;
  });
  return { total, pending, inProgress, resolved };
}

/** Get recent complaints (limit 5) */
export async function getRecentComplaints(citizenId: string, limitN = 5) {
  const q = query(
    complaintsCol(),
    where('citizenId', '==', citizenId),
    orderBy('createdAt', 'desc'),
    limit(limitN)
  );
  const snap = await getDocs(q);
  const complaints: Complaint[] = [];
  snap.forEach((doc) => {
    const data = doc.data();
    complaints.push({
      id: doc.id,
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
    });
  });
  return complaints;
}

/** Get notifications for a citizen */
export async function getCitizenNotifications(citizenId: string, limitN = 5) {
  const notifCol = collection(getClientDb(), 'notifications');
  const q = query(
    notifCol,
    where('citizenId', '==', citizenId),
    orderBy('createdAt', 'desc'),
    limit(limitN)
  );
  const snap = await getDocs(q);
  const notifs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return notifs;
}
