import { NextRequest, NextResponse } from "next/server";
import { getDownloadURL } from "firebase-admin/storage";
import { getCurrentSession } from "@/lib/auth/session";
import { getAdminDb, getAdminStorage, isFirebaseAdminConfigured } from "@/lib/firebase/admin";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_FOLDERS = new Set(["complaintImages", "taskEvidence", "profilePhotos"]);
const FIRESTORE_CHUNK_SIZE = 700 * 1024; // 700KB (safely below Firestore 1MiB doc limit)

// Cache Storage bucket availability check for 5 minutes
let bucketAvailableCache: { checkedAt: number; available: boolean; bucketName: string } | null = null;

async function isStorageBucketReady(bucketName: string): Promise<boolean> {
  if (!bucketName) return false;
  const now = Date.now();
  if (
    bucketAvailableCache &&
    bucketAvailableCache.bucketName === bucketName &&
    now - bucketAvailableCache.checkedAt < 5 * 60 * 1000
  ) {
    return bucketAvailableCache.available;
  }

  try {
    const storage = getAdminStorage();
    const [exists] = await storage.bucket(bucketName).exists();
    bucketAvailableCache = { checkedAt: now, available: exists, bucketName };
    return exists;
  } catch {
    bucketAvailableCache = { checkedAt: now, available: false, bucketName };
    return false;
  }
}

function resolveMime(file: File): string {
  const mime = (file.type || "").toLowerCase();
  if (mime === "image/jpg") return "image/jpeg";
  if (mime === "image/jpeg" || mime === "image/png" || mime === "image/webp") return mime;
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return mime;
}

function sanitizeSegment(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 64) || "upload.jpg";
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!session.isActive) {
      return NextResponse.json({ error: "Account is inactive" }, { status: 403 });
    }

    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json(
        { error: "Server credentials are not configured." },
        { status: 500 }
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "Invalid multipart form data." }, { status: 400 });
    }

    const file = formData.get("file");
    const folderRaw = String(formData.get("folder") || "complaintImages");
    const extraId = String(formData.get("extraId") || "").replace(/[^a-zA-Z0-9_-]/g, "");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 });
    }

    if (!ALLOWED_FOLDERS.has(folderRaw)) {
      return NextResponse.json({ error: "Invalid upload folder." }, { status: 400 });
    }

    const resolvedMime = resolveMime(file);
    if (!ALLOWED_TYPES.has(resolvedMime)) {
      return NextResponse.json(
        { error: `Unsupported file type (${file.type || file.name}). Allowed: JPG, PNG, WebP.` },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File exceeds maximum 5MB size limit." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "";
    const safeName = sanitizeSegment(file.name);

    // 1. Use Firebase Storage if the bucket is provisioned
    if (await isStorageBucketReady(bucketName)) {
      try {
        const uniqueName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName}`;
        let objectPath: string;
        if (folderRaw === "taskEvidence") {
          objectPath = `taskEvidence/${session.uid}/${extraId || "general"}/${uniqueName}`;
        } else if (folderRaw === "profilePhotos") {
          objectPath = `profilePhotos/${session.uid}/${uniqueName}`;
        } else {
          objectPath = `complaintImages/${session.uid}/${uniqueName}`;
        }

        const storage = getAdminStorage();
        const fileRef = storage.bucket(bucketName).file(objectPath);
        await fileRef.save(buffer, {
          metadata: {
            contentType: resolvedMime,
            metadata: {
              uploadedBy: session.uid,
              uploadedAt: new Date().toISOString(),
            },
          },
        });

        const url = await getDownloadURL(fileRef);
        return NextResponse.json({ success: true, url, backend: "storage" });
      } catch (storageErr) {
        console.warn("Firebase Storage save failed, falling back to Firestore media store:", storageErr);
        bucketAvailableCache = { checkedAt: Date.now(), available: false, bucketName };
      }
    }

    // 2. Fallback: Persist image reliably in Firestore (chunked if > 700KB) and serve via /api/media/[id]
    const db = getAdminDb();
    const mediaRef = db.collection("uploadedMedia").doc();
    const now = new Date();

    if (buffer.length <= FIRESTORE_CHUNK_SIZE) {
      await mediaRef.set({
        contentType: resolvedMime,
        fileName: safeName,
        size: buffer.length,
        folder: folderRaw,
        extraId: extraId || null,
        uploadedBy: session.uid,
        chunkCount: 0,
        data: buffer,
        createdAt: now,
      });
    } else {
      const totalChunks = Math.ceil(buffer.length / FIRESTORE_CHUNK_SIZE);
      await mediaRef.set({
        contentType: resolvedMime,
        fileName: safeName,
        size: buffer.length,
        folder: folderRaw,
        extraId: extraId || null,
        uploadedBy: session.uid,
        chunkCount: totalChunks,
        createdAt: now,
      });

      const batch = db.batch();
      for (let i = 0; i < totalChunks; i++) {
        const slice = buffer.subarray(i * FIRESTORE_CHUNK_SIZE, (i + 1) * FIRESTORE_CHUNK_SIZE);
        const chunkRef = mediaRef.collection("chunks").doc(String(i).padStart(4, "0"));
        batch.set(chunkRef, { index: i, data: slice });
      }
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      url: `/api/media/${mediaRef.id}`,
      backend: "firestore",
    });
  } catch (err: unknown) {
    console.error("POST /api/upload error:", err);
    const message = err instanceof Error ? err.message : "Failed to upload image.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
