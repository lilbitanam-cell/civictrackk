import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { getClientStorage } from "./config";

export const STORAGE_LIMITS = {
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
};

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates a file before upload against size and type constraints.
 */
export function validateStorageFile(file: File): FileValidationResult {
  if (!file) {
    return { isValid: false, error: "No file was provided for upload." };
  }

  if (!STORAGE_LIMITS.ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `Unsupported file format (${file.type || "unknown"}). Allowed formats are JPG, PNG, and WebP.`,
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
  const cleanBase = originalName
    .substring(0, originalName.lastIndexOf("."))
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .substring(0, 32);
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${cleanBase}_${timestamp}_${randomSuffix}.${extension}`;
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

/**
 * Uploads a citizen complaint photograph.
 */
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
    contentType: file.type,
    customMetadata: {
      uploadedAt: new Date().toISOString(),
      complaintId,
    },
  });

  return getDownloadURL(snapshot.ref);
}

/**
 * Uploads worker field completion evidence.
 */
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
    contentType: file.type,
    customMetadata: {
      uploadedAt: new Date().toISOString(),
      taskId,
    },
  });

  return getDownloadURL(snapshot.ref);
}

/**
 * Uploads a user profile photograph.
 */
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
    contentType: file.type,
    customMetadata: {
      uploadedAt: new Date().toISOString(),
      userId,
    },
  });

  return getDownloadURL(snapshot.ref);
}

/**
 * Deletes a file from Firebase Storage given its storage path or download ref.
 */
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
