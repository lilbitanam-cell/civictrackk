import { UserRole } from "@/types";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  departmentId?: string;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
}

export const ROLE_HOME_ROUTES: Record<UserRole, string> = {
  citizen: "/citizen/dashboard",
  admin: "/admin/dashboard",
  worker: "/worker/dashboard",
};

export function isValidRole(role: string): role is UserRole {
  return role === "citizen" || role === "admin" || role === "worker";
}

/**
 * Maps raw Firebase Auth errors to clean, informative municipal error notices.
 */
export function getFriendlyAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password. Please verify your credentials and try again.";
    case "auth/email-already-in-use":
      return "An account with this email address is already registered. Please sign in.";
    case "auth/weak-password":
      return "Password is too weak. Please use at least 6 characters including numbers or symbols.";
    case "auth/invalid-email":
      return "Please enter a valid municipal or citizen email address.";
    case "auth/user-disabled":
      return "This account has been deactivated by the municipal administration. Contact support.";
    case "auth/popup-closed-by-user":
      return "Google sign-in window was closed before completion. Please try again.";
    case "auth/popup-blocked":
      return "The authentication popup was blocked by your browser. Please allow popups for this site.";
    case "auth/too-many-requests":
      return "Too many failed sign-in attempts. For your security, this account is temporarily locked. Please try again later or reset your password.";
    case "auth/network-request-failed":
      return "Network connection issue. Please check your internet connection.";
    default:
      return "An unexpected authentication error occurred. Please try again.";
  }
}
