# CivicTrack — Municipal Civic Issue & Work Order Management Platform

CivicTrack is a production-grade, multi-role municipal management platform built to bridge the gap between citizens, municipal administrators, and field workers. It provides an end-to-end audit-trailed workflow: from reporting civic hazards (potholes, water leaks, garbage overflows) to automated administrative triage, field worker dispatch, proof-of-work verification, and citizen notification.

---

## 1. Tech Stack

- **Framework**: Next.js 16 (App Router, Server & Client Components, Partial Prerendering, Proxy/Middleware)
- **Runtime & Library**: React 19, TypeScript 5
- **Backend & Database**: Firebase (Cloud Firestore, Cloud Storage, Firebase Auth, Firebase Admin SDK)
- **Styling & UI**: Tailwind CSS v4, Lucide React Icons, Radix UI Primitives
- **Data Visualizations & Geospatial**: Recharts (Analytics), Leaflet & OpenStreetMap (Interactive Issue Map)
- **Date Utilities**: date-fns
- **Security**: Cryptographic HMAC-SHA256 Server Sessions, Strict Cloud Firestore & Storage Security Rules

---

## 2. System Architecture & Roles

CivicTrack features three distinct, role-segregated panels:

```
[ Citizen Panel ]                 [ Municipal Admin Panel ]               [ Field Worker Panel ]
• Report Issue (Photos + GPS)      • Real-time KPI Dashboard              • Mobile-first Work Orders
• Track My Complaints             • Triage & Verify Complaints            • Acknowledge & Start Work
• Status Timeline & History        • Department & Worker CRUD             • Upload Photographic Proof
• Notifications Feed              • Interactive Leaflet Map              • Submit for Admin Approval
• Citizen Profile                 • Analytics & CSV Export               • Worker Profile
```

---

## 3. Getting Started & Setup Commands

### Prerequisites
- Node.js `v20.x` or `v22.x`
- npm `v10.x` or higher
- Firebase Project with Firestore, Authentication, and Storage enabled

### Installation
Clone the repository and install dependencies with legacy peer resolution (due to React 19 compatibility):

```bash
git clone https://github.com/your-username/civictrack.git
cd civictrack
npm install --legacy-peer-deps
```

### Local Development
Run the local Next.js development server:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

### Type Check & Build
Verify TypeScript diagnostics and generate an optimized production build:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

---

## 4. Environment Variables Configuration

Copy `.env.example` to `.env.local` and populate your credentials:

```bash
cp .env.example .env.local
```

### Environment Variables Reference

| Variable | Scope | Description |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Public / Client | Firebase Web App API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Public / Client | Firebase Auth Domain (e.g. `your-app.firebaseapp.com`) |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Public / Client | Firebase Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Public / Client | Firebase Cloud Storage Bucket URL |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Public / Client | Firebase Cloud Messaging Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Public / Client | Firebase Web App ID |
| `FIREBASE_ADMIN_PROJECT_ID` | Server-side Only | Google Cloud Project ID for Admin SDK |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Server-side Only | Service Account Client Email |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Server-side Only | Service Account RSA Private Key |
| `SESSION_SECRET` | Server-side Only | 32+ character string for HMAC token cryptographic signing |

---

## 5. Firebase Setup & Security Rules

### 1. Enable Firebase Services
1. **Firebase Authentication**: Enable **Email/Password** and **Google Sign-In**. In Google provider settings, ensure your authorization domains include `localhost` and your production deployment domain (e.g., `*.vercel.app`).
2. **Cloud Firestore**: Create a Firestore database in your preferred region.
3. **Cloud Storage**: Create a Cloud Storage bucket for complaint photos and evidence proof.

### 2. Deploy Security Rules
Deploy `firestore.rules` and `storage.rules` to ensure server-side data isolation:

```bash
# Using Firebase CLI
firebase deploy --only firestore:rules,storage
```

---

## 6. Database Collections Structure

```
Firestore
├── users/{userId}
│   ├── displayName, email, phone, role ("citizen" | "admin" | "worker")
│   ├── departmentId, departmentName, isActive, avatarUrl
│
├── complaints/{complaintId}
│   ├── ticketNumber (e.g. CT-202604-1234)
│   ├── title, description, category, categoryLabel
│   ├── status ("submitted" | "under_review" | "assigned" | "in_progress" | "resolution_submitted" | "resolved" | "closed" | "rejected")
│   ├── priority ("low" | "medium" | "high" | "urgent")
│   ├── location: { latitude, longitude, address, landmark, ward, city }
│   ├── images: string[] (Storage download URLs)
│   ├── citizenId, citizenName, citizenPhone
│   ├── departmentId, departmentName
│   ├── assignedWorkerId, assignedWorkerName, assignedAt
│   ├── resolutionNotes, resolutionImages: string[], resolvedAt, rejectionReason
│   └── createdAt, updatedAt
│
├── workerTasks/{taskId}
│   ├── complaintId, complaintTicketNumber, complaintTitle, complaintCategory
│   ├── workerId, workerName, departmentId, status ("pending" | "accepted" | "in_progress" | "completed")
│   ├── priority, location, instructions
│   ├── evidenceImages: string[], evidenceNotes
│   └── startedAt, completedAt, assignedByUserId, assignedByUserName, createdAt
│
├── complaintHistory/{historyId} (Immutable Audit Log)
│   ├── complaintId, actorId, actorName, actorRole ("citizen" | "admin" | "worker")
│   ├── action ("submitted" | "status_changed" | "department_assigned" | "worker_assigned" | "reopened" | "closed")
│   ├── previousStatus, newStatus, notes, createdAt
│
├── departments/{departmentId}
│   ├── name, code, description, headName, headEmail, contactNumber
│   └── categories: string[], activeWorkersCount, slaHours, isActive
│
└── notifications/{notificationId}
    ├── userId (Recipient UID), title, message, type, relatedComplaintId, relatedTaskId, actionUrl, isRead, createdAt
```

---

## 7. Security & Authorization Model

1. **Role Verification**: Verified server-side on every request using cryptographic HMAC cookies (`civictrack_session`).
2. **Access Control**:
   - Citizens can only query and mutate their own complaints.
   - Field workers can only access work orders assigned specifically to their UID.
   - Field workers **cannot** directly set complaint status to `resolved` — they submit evidence for municipal admin approval.
   - Municipal admins have full oversight, worker assignment, verification, and rejection privileges.
   - Unauthenticated users are redirected to `/login` with callback URLs preserved.
   - Non-privileged access attempts are routed to `/unauthorized`.
3. **Database Rules**: Firestore rules prevent users from elevating their own roles (`request.resource.data.role == resource.data.role`) and enforce read isolation on user notifications and worker tasks.

---

## 8. Application Routes Map

### Public & Auth
- `/` — Landing page with hero, active stats, civic categories, process explainer, and municipal call-to-action
- `/login` — Email/password login, Google OAuth, and development role quick-switch
- `/register` — Citizen registration with validation
- `/unauthorized` — Graceful access denial feedback page

### Citizen Portal (`/citizen/*`)
- `/citizen/dashboard` — Overview of personal complaints, quick reporting, and live notification cards
- `/citizen/report` — Interactive issue filing with photo upload and Leaflet GPS coordinate picker
- `/citizen/complaints` — Filterable/searchable directory of personal reported issues
- `/citizen/complaints/[id]` — Detailed issue timeline, worker assignment, and photo evidence
- `/citizen/notifications` — Notification inbox with one-click "Mark as Read"
- `/citizen/profile` — Profile avatar and contact phone management

### Municipal Admin Portal (`/admin/*`)
- `/admin/dashboard` — Live KPI statistics cards and Recharts analytics (status, category, monthly trend)
- `/admin/complaints` — Searchable, filterable table with status badges and quick review links
- `/admin/complaints/[id]` — Detailed review, priority override, administrative remarks, and worker dispatch
- `/admin/departments` — CRUD management for municipal departments and service level agreements (SLAs)
- `/admin/workers` — Worker directory, department assignment, and status toggles
- `/admin/map` — Interactive Leaflet map with status-colored SVG markers and side inspection panel
- `/admin/analytics` — Statistical breakdowns, average resolution times, and CSV report export

### Field Worker Portal (`/worker/*`)
- `/worker/dashboard` — Mobile-first task summary, active work orders, and completion counts
- `/worker/tasks` — List of assigned work orders filterable by priority and status
- `/worker/tasks/[id]` — Work order details, citizen photographs, step-by-step acknowledge/start/evidence upload
- `/worker/profile` — Personnel credentials, department affiliation, and verified badge

---

## 9. End-to-End Workflow & Verification Journey

Follow this test workflow to verify system connectivity:

1. **File Complaint**: Navigate to `/citizen/report` as a citizen. Upload photos, pick a map location, select a category, and submit.
2. **Admin Triage**: Sign in as Admin, navigate to `/admin/complaints`, open the new ticket. Verify the complaint (moves to `under_review`).
3. **Dispatch Worker**: In the complaint view, choose the corresponding municipal department, select an active field worker, and click **Assign Worker**.
4. **Worker Acknowledgement**: Sign in as the assigned Worker. Open `/worker/tasks`, open the assigned task, and click **Acknowledge Task** (status becomes `accepted`).
5. **Start Work Order**: Click **Start Work**. Complaint status automatically mirrors to `in_progress`, and citizen receives an in-app notification.
6. **Submit Evidence**: Worker photographs the completed repair, writes completion remarks, and clicks **Submit for Verification** (status advances to `resolution_submitted`).
7. **Admin Approval**: Admin visits `/admin/complaints/[id]`, inspects the worker's evidence photos and remarks, and clicks **Approve Resolution**.
8. **Resolution & Audit**: Complaint status becomes `resolved`, `resolvedAt` timestamp is recorded, a final notification is dispatched to the citizen, and the complete audit trail is permanently preserved in `complaintHistory`.

---

## 10. Deployment to Vercel

CivicTrack is pre-configured for Vercel deployment:

1. **Push Repository**: Push the code to GitHub / GitLab.
2. **Import Project**: In the [Vercel Dashboard](https://vercel.com), click **Add New Project** and import the repository.
3. **Framework Preset**: Vercel will automatically detect **Next.js**.
4. **Build Command**: `next build --webpack` (configured in `vercel.json`).
5. **Environment Variables**: Add all environment variables from `.env.example` under **Settings > Environment Variables**.
6. **Firebase Auth Domain**: In the Firebase Console (**Authentication > Settings > Authorized domains**), add your deployed Vercel domain (e.g., `your-project.vercel.app`).
7. **Deploy**: Click **Deploy**. Vercel will compile the application and generate static routes with Partial Prerendering and streaming SSR.
