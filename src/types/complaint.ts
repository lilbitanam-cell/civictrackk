export type ComplaintStatus = 'pending' | 'in-progress' | 'resolved';

export interface Complaint {
  id: string; // unique complaint ID
  citizenId: string; // UID of the user who created it
  title: string;
  description: string;
  category: string;
  address: string;
  city: string;
  landmark?: string;
  location: {
    lat: number;
    lng: number;
  };
  imageUrls: string[]; // URLs in Firebase Storage
  status: ComplaintStatus;
  priority?: string; // optional priority field
  departmentId?: string;
  createdAt: any; // Firestore Timestamp
  updatedAt?: any;
}
