"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { getClientAuth, isClientFirebaseConfigured } from "@/lib/firebase/config";
import { Building2, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/types";

interface TopNavProps {
  currentRole?: UserRole;
  userEmail?: string;
  showAuthLinks?: boolean;
}

export function TopNav({
  currentRole,
  userEmail,
  showAuthLinks = true,
}: TopNavProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const roleLabels: Record<UserRole, { label: string; variant: "default" | "secondary" | "pale" }> = {
    citizen: { label: "Citizen Portal", variant: "secondary" },
    worker: { label: "Field Worker", variant: "pale" },
    admin: { label: "Administration", variant: "default" },
  };

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      if (isClientFirebaseConfigured) {
        try {
          const auth = getClientAuth();
          await signOut(auth);
        } catch (e) {
          console.warn("Client Firebase signOut failed, proceeding to clear server session:", e);
        }
      }

      await fetch("/api/auth/session", { method: "DELETE" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Sign out error:", err);
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E5E8DF] bg-white">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-[#30352D] hover:opacity-90 transition-opacity"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#788568] text-white">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-[#30352D] leading-none">
                CivicTrack
              </span>
              <span className="text-[10px] text-[#74796F] font-medium tracking-wide uppercase mt-0.5">
                Municipal Services
              </span>
            </div>
          </Link>
          {currentRole && (
            <Badge
              variant={roleLabels[currentRole].variant}
              className="ml-2 hidden sm:inline-flex"
            >
              {roleLabels[currentRole].label}
            </Badge>
          )}
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center gap-3">
          {userEmail ? (
            <div className="flex items-center gap-3 text-xs">
              <span className="hidden md:inline-block text-[#74796F]">
                {userEmail}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isLoggingOut}
                className="flex items-center gap-1 text-[#74796F] hover:text-[#9B3B3B] font-medium transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>{isLoggingOut ? "Signing out..." : "Sign out"}</span>
              </button>
            </div>
          ) : showAuthLinks ? (
            <div className="flex items-center gap-2 text-xs font-medium">
              <Link
                href="/login"
                className="rounded-md px-3 py-1.5 text-[#30352D] hover:bg-[#F1F3EC] transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-[#788568] px-3 py-1.5 text-white hover:bg-[#536247] transition-colors"
              >
                Register
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
