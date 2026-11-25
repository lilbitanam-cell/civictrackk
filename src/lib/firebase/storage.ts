import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { getClientAuth, getClientStorage, isClientFirebaseConfigured } from "./config";

export const STORAGE_LIMITS = {
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  ALLOWED_EXTENSIONS: ["jpg", "jpeg", "png", "webp"],
};

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

/** Normalize MIME type (handles `image/jpg` and empty MIME on some browsers). */
export function resolveImageMimeType(file: File): string {
  const mime = (file.type || "").toLowerCase();
  if (mime === "image/jpg") return "image/jpeg";
  if (mime === "image/jpeg" || mime === "image/png" || mime === "image/webp") {
    return mime;
  }
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return mime;
}

/**
 * Validates a file before upload against size and type constraints.
 */
export function validateStorageFile(file: File): FileValidationResult {
  if (!file) {
    return { isValid: false, error: "No file was provided for upload." };
  }

  const resolvedMime = resolveImageMimeType(file);
  if (!["image/jpeg", "image/png", "image/webp"].includes(resolvedMime)) {
    return {
      isValid: false,
      error: `Unsupported file format (${file.type || file.name}). Allowed formats are JPG, PNG, and WebP.`,
    };
  }

  if (file.size > STORAGE_LIMITS.MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `File size exceeds the 5MB limit (current: ${sizeMb}MB).`,
    };
  }

  return { isValid: true };
}

/**
 * Generates a clean, collision-free storage filename.
 */
function sanitizeFileName(originalName: string): string {
  const extension = originalName.split(".").pop()?.toLowerCase() || "jpg";
  const lastDot = originalName.lastIndexOf(".");
  const base = lastDot > 0 ? originalName.substring(0, lastDot) : originalName;
  const cleanBase = base
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .substring(0, 32) || "image";
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${cleanBase}_${timestamp}_${randomSuffix}.${extension}`;
}

/**
 * Compresses large images in the browser via Canvas so uploads are fast and
 * stay compact across serverless limits and Firestore fallback storage.
 */
async function compressImageIfNeeded(file: File): Promise<File> {
  const mime = resolveImageMimeType(file);
  // Skip small files (already <= 450 KB) or non-browser contexts
  if (typeof window === "undefined" || file.size <= 450 * 1024) {
    if (file.type !== mime) {
      return new File([file], file.name, { type: mime });
    }
    return file;
  }

  try {
    const objectUrl = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("Image decode failed"));
        el.src = objectUrl;
      });

      const MAX_DIM = 1400;
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        const scale = Math.min(MAX_DIM / width, MAX_DIM / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return file;

      ctx.drawImage(img, 0, 0, width, height);

      const targetMime = mime === "image/png" ? "image/png" : "image/jpeg";
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, targetMime, 0.82)
      );

      if (!blob || blob.size >= file.size) {
        return file;
      }

      const ext = targetMime === "image/png" ? "png" : "jpg";
      const base = file.name.replace(/\.[^.]+$/, "") || "photo";
      return new File([blob], `${base}.${ext}`, { type: targetMime });
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    return file;
  }
}

/**
 * Storage Path Builders
 */
export const StoragePaths = {
  complaintPhoto: (complaintId: string, fileName: string) =>
    `complaints/${complaintId}/${fileName}`,
  workerEvidence: (taskId: string, fileName: string) =>
    `tasks/${taskId}/evidence/${fileName}`,
  profilePhoto: (userId: string, fileName: string) =>
    `profiles/${userId}/${fileName}`,
};

export async function uploadComplaintPhoto(
  complaintId: string,
  file: File
): Promise<string> {
  const validation = validateStorageFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const storage = getClientStorage();
  const safeName = sanitizeFileName(file.name);
  const path = StoragePaths.complaintPhoto(complaintId, safeName);
  const storageRef = ref(storage, path);

  const snapshot = await uploadBytes(storageRef, file, {
    contentType: resolveImageMimeType(file),
    customMetadata: {
      uploadedAt: new Date().toISOString(),
      complaintId,
    },
  });

  return getDownloadURL(snapshot.ref);
}

export async function uploadWorkerEvidence(
  taskId: string,
  file: File
): Promise<string> {
  const validation = validateStorageFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const storage = getClientStorage();
  const safeName = sanitizeFileName(file.name);
  const path = StoragePaths.workerEvidence(taskId, safeName);
  const storageRef = ref(storage, path);

  const snapshot = await uploadBytes(storageRef, file, {
    contentType: resolveImageMimeType(file),
    customMetadata: {
      uploadedAt: new Date().toISOString(),
      taskId,
    },
  });

  return getDownloadURL(snapshot.ref);
}

export async function uploadProfilePhoto(
  userId: string,
  file: File
): Promise<string> {
  const validation = validateStorageFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const storage = getClientStorage();
  const safeName = sanitizeFileName(file.name);
  const path = StoragePaths.profilePhoto(userId, safeName);
  const storageRef = ref(storage, path);

  const snapshot = await uploadBytes(storageRef, file, {
    contentType: resolveImageMimeType(file),
    customMetadata: {
      uploadedAt: new Date().toISOString(),
      userId,
    },
  });

  return getDownloadURL(snapshot.ref);
}

export async function deleteStorageFile(storagePath: string): Promise<boolean> {
  try {
    const storage = getClientStorage();
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
    return true;
  } catch (error) {
    console.error("Failed to delete storage file:", error);
    return false;
  }
}

export type UploadFolder = "complaintImages" | "taskEvidence" | "profilePhotos";

// If client Firebase Storage fails once (e.g. bucket not provisioned or CORS),
// skip retrying it on subsequent files in this tab so multi-image uploads stay fast.
let clientStorageFailedInSession = false;

/**
 * Uploads an image via Firebase Client Storage when available, and automatically
 * falls back to the authenticated server endpoint (/api/upload) if client auth
 * is missing, CORS blocks, or Storage is not provisioned.
 */
export async function uploadImageWithFallback(
  file: File,
  folder: UploadFolder,
  extraId?: string
): Promise<string> {
  const validation = validateStorageFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const preparedFile = await compressImageIfNeeded(file);
  const contentType = resolveImageMimeType(preparedFile);

  // 1. Try client Firebase Storage with a hard timeout so missing buckets/CORS never hang
  if (isClientFirebaseConfigured && !clientStorageFailedInSession) {
    try {
      const auth = getClientAuth();
      const currentUser = auth.currentUser;
      if (currentUser) {
        const safeName = sanitizeFileName(preparedFile.name);
        let path: string;
        if (folder === "taskEvidence") {
          path = `taskEvidence/${currentUser.uid}/${extraId || "general"}/${safeName}`;
        } else if (folder === "profilePhotos") {
          path = `profilePhotos/${currentUser.uid}/${safeName}`;
        } else {
          path = `complaintImages/${currentUser.uid}/${safeName}`;
        }
        const storage = getClientStorage();
        const storageRef = ref(storage, path);

        const downloadUrl = await Promise.race<string>([
          (async () => {
            const snapshot = await uploadBytes(storageRef, preparedFile, {
              contentType,
              customMetadata: { uploadedAt: new Date().toISOString() },
            });
            return await getDownloadURL(snapshot.ref);
          })(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Client Storage upload timed out")), 4500)
          ),
        ]);

        return downloadUrl;
      }
    } catch (clientErr) {
      clientStorageFailedInSession = true;
      console.warn(
        "Client Storage upload unavailable, falling back to /api/upload:",
        clientErr
      );
    }
  }

  // 2. Fallback to authenticated server upload route
  const formData = new FormData();
  formData.append("file", preparedFile);
  formData.append("folder", folder);
  if (extraId) formData.append("extraId", extraId);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  const text = await res.text();
  let data: { url?: string; error?: string } = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(
        res.ok
          ? "Upload server returned an unexpected response."
          : `Upload failed (HTTP ${res.status}).`
      );
    }
  }

  if (!res.ok || !data.url) {
    throw new Error(data.error || `Failed to upload image (HTTP ${res.status}).`);
  }

  return data.url;
}
