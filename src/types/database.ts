import { Timestamp } from "firebase/firestore";

export type UserRole = "citizen" | "admin" | "worker";

export interface GeoLocation {
  latitude: number;
  longitude: number;
  address: string;
  landmark?: string;
  ward?: string;
  city?: string;
}

/**
 * 1. users collection
 * Document ID: Firebase Auth UID
 */
export interface UserDocument {
  id: string;
  email: string;
  displayName: string;
  phone?: string;
  role: UserRole;
  departmentId?: string; // For workers and department-level admins
  departmentName?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

export type ComplaintCategory =
  | "roads_potholes"
  | "garbage_collection"
  | "water_leakage"
  | "drainage"
  | "streetlights"
  | "public_infrastructure"
  | "sanitation"
  | "other";

export type ComplaintStatus =
  | "submitted"
  | "under_review"
  | "assigned"
  | "in_progress"
  | "resolution_submitted"
  | "resolved"
  | "closed"
  | "rejected";

export type ComplaintPriority = "low" | "medium" | "high" | "urgent";

/**
 * 2. complaints collection
 * Document ID: auto-generated or composite ID (e.g. CT-YYYYMM-XXXX)
 */
export interface ComplaintDocument {
  id: string;
  ticketNumber: string; // e.g. CT-2026-0001
  title: string;
  description: string;
  category: ComplaintCategory;
  categoryLabel: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  location: GeoLocation;
  images: string[]; // Storage download URLs
  citizenId: string;
  citizenName: string;
  citizenPhone?: string;
  departmentId?: string;
  departmentName?: string;
  assignedWorkerId?: string;
  assignedWorkerName?: string;
  assignedAt?: Timestamp | string;
  resolvedAt?: Timestamp | string;
  closedAt?: Timestamp | string;
  resolutionNotes?: string;
  resolutionImages?: string[];
  rejectionReason?: string;
  adminRemarks?: string;
  upvotesCount: number;
  commentsCount: number;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

/**
 * 3. departments collection
 * Document ID: auto-generated or slug (e.g. "pwd-roads", "sanitation", "water-works")
 */
export interface DepartmentDocument {
  id: string;
  name: string;
  code: string;
  description: string;
  headName?: string;
  headEmail?: string;
  contactNumber?: string;
  categories: ComplaintCategory[];
  activeWorkersCount: number;
  slaHours: number; // Service level agreement target
  isActive: boolean;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

export type TaskStatus = "pending" | "accepted" | "in_progress" | "completed" | "on_hold";

/**
 * 4. workerTasks collection
 * Document ID: auto-generated
 */
export interface WorkerTaskDocument {
  id: string;
  complaintId: string;
  complaintTicketNumber: string;
  complaintTitle: string;
  complaintCategory: ComplaintCategory;
  workerId: string;
  workerName: string;
  departmentId: string;
  status: TaskStatus;
  priority: ComplaintPriority;
  location: GeoLocation;
  instructions?: string;
  startedAt?: Timestamp | string;
  completedAt?: Timestamp | string;
  evidenceImages: string[]; // Uploaded field proof images
  evidenceNotes?: string;
  assignedByUserId: string;
  assignedByUserName: string;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

export type NotificationType =
  | "complaint_submitted"
  | "complaint_assigned"
  | "complaint_status_change"
  | "complaint_resolved"
  | "task_assigned"
  | "announcement";

/**
 * 5. notifications collection
 * Document ID: auto-generated
 */
export interface NotificationDocument {
  id: string;
  userId: string; // Target recipient
  title: string;
  message: string;
  type: NotificationType;
  relatedComplaintId?: string;
  relatedTaskId?: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: Timestamp | string;
}

/**
 * 6. complaintHistory collection
 * Document ID: auto-generated audit log
 */
export interface ComplaintHistoryDocument {
  id: string;
  complaintId: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action:
    | "submitted"
    | "status_changed"
    | "priority_changed"
    | "department_assigned"
    | "worker_assigned"
    | "comment_added"
    | "evidence_uploaded"
    | "reopened"
    | "closed";
  previousStatus?: ComplaintStatus;
  newStatus?: ComplaintStatus;
  notes?: string;
  createdAt: Timestamp | string;
}

/**
 * 7. feedback collection
 * Document ID: auto-generated
 */
export interface FeedbackDocument {
  id: string;
  complaintId: string;
  citizenId: string;
  rating: number; // 1 to 5 stars
  isSatisfied: boolean;
  feedbackText?: string;
  createdAt: Timestamp | string;
}
