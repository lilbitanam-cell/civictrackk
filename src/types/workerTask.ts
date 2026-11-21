export type WorkerTaskStatus = 'assigned' | 'acknowledged' | 'in-progress' | 'submitted' | 'completed' | 'rejected';

export interface WorkerTask {
  id: string; // task document ID
  complaintId: string;
  workerId: string;
  title: string;
  category: string;
  priority?: string;
  address: string;
  city: string;
  landmark?: string;
  location: { lat: number; lng: number };
  status: WorkerTaskStatus;
  assignmentDate: any; // Firestore Timestamp
  remarks?: string;
  beforeImages?: string[]; // URLs
  afterImages?: string[];
  createdAt?: any;
  updatedAt?: any;
}
