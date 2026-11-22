import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { getClientDb } from '@/lib/firebase/config';
import type { Complaint } from '@/types/complaint';

/** Fetch overall complaint statistics for admin dashboard */
export async function getAdminComplaintStats() {
  const db = getClientDb();
  const col = collection(db, 'complaints');
  const snap = await getDocs(col);
  const total = snap.size;
  const statusCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  const priorityCounts: Record<string, number> = {};
  const monthly: Record<string, number> = {};

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0‑based

  snap.forEach((doc) => {
    const data = doc.data();
    // status
    const status = data.status as string;
    statusCounts[status] = (statusCounts[status] || 0) + 1;
    // category
    const cat = data.category as string;
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    // priority (optional)
    const prio = data.priority as string;
    if (prio) priorityCounts[prio] = (priorityCounts[prio] || 0) + 1;
    // monthly trend (by createdAt)
    const ts: Timestamp = data.createdAt;
    if (ts && ts.toDate) {
      const d = ts.toDate();
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      monthly[key] = (monthly[key] || 0) + 1;
    }
  });

  // Convert monthly object to sorted array (last 12 months)
  const monthlyArray = Object.entries(monthly)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    total,
    statusCounts,
    categoryCounts,
    priorityCounts,
    monthlyArray,
  };
}

/** Fetch recent complaints (ordered by newest) */
export async function getRecentAdminComplaints(limitN = 5) {
  const col = collection(getClientDb(), 'complaints');
  const q = query(col, orderBy('createdAt', 'desc'), limit(limitN));
  const snap = await getDocs(q);
  const list: Complaint[] = [];
  snap.forEach((doc) => {
    const d = doc.data();
    list.push({
      id: doc.id,
      citizenId: d.citizenId,
      title: d.title,
      description: d.description,
      category: d.category,
      address: d.address,
      city: d.city,
      landmark: d.landmark,
      location: d.location,
      imageUrls: d.imageUrls,
      status: d.status,
      priority: d.priority,
      departmentId: d.departmentId,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    });
  });
  return list;
}

/** Fetch high‑priority complaints (priority == 'high' or similar) */
export async function getHighPriorityComplaints(limitN = 5) {
  const col = collection(getClientDb(), 'complaints');
  try {
    const q = query(col, where('priority', '==', 'high'), orderBy('createdAt', 'desc'), limit(limitN));
    const snap = await getDocs(q);
    const list: Complaint[] = [];
    snap.forEach((doc) => {
      const d = doc.data();
      list.push({
        id: doc.id,
        citizenId: d.citizenId,
        title: d.title,
        description: d.description,
        category: d.category,
        address: d.address,
        city: d.city,
        landmark: d.landmark,
        location: d.location,
        imageUrls: d.imageUrls,
        status: d.status,
        priority: d.priority,
        departmentId: d.departmentId,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      });
    });
    return list;
  } catch (err: any) {
    if (err?.code === 'failed-precondition' || err?.message?.includes('requires an index')) {
      const q = query(col, where('priority', '==', 'high'));
      const snap = await getDocs(q);
      const list: Complaint[] = [];
      snap.forEach((doc) => {
        const d = doc.data();
        list.push({
          id: doc.id,
          citizenId: d.citizenId,
          title: d.title,
          description: d.description,
          category: d.category,
          address: d.address,
          city: d.city,
          landmark: d.landmark,
          location: d.location,
          imageUrls: d.imageUrls,
          status: d.status,
          priority: d.priority,
          departmentId: d.departmentId,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
        });
      });
      list.sort((a, b) => {
        const tA = (a.createdAt as any)?.seconds ? (a.createdAt as any).seconds * 1000 : new Date(a.createdAt || 0).getTime();
        const tB = (b.createdAt as any)?.seconds ? (b.createdAt as any).seconds * 1000 : new Date(b.createdAt || 0).getTime();
        return tB - tA;
      });
      return list.slice(0, limitN);
    }
    throw err;
  }
}
