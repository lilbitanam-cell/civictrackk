"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { getClientAuth, isClientFirebaseConfigured } from "@/lib/firebase/config";
import { LogOut } from "lucide-react";
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
    <header className="sticky top-0 z-40 w-full border-b border-[#DDD9CE] bg-[#F7F5EE]/95 backdrop-blur-[2px]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center hover:opacity-90 transition-opacity"
            aria-label="CivicTrack — The Civic Journal"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/logos/CivicTrack Watercolor Civic Emblem.png"
              alt="CivicTrack"
              className="h-10 sm:h-11 w-auto object-contain mix-blend-multiply"
            />
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
              <span className="hidden md:inline-block text-[#77796F]">
                {userEmail}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isLoggingOut}
                className="flex items-center gap-1 text-[#77796F] hover:text-[#8B342E] font-medium transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>{isLoggingOut ? "Signing out..." : "Sign out"}</span>
              </button>
            </div>
          ) : showAuthLinks ? (
            <div className="flex items-center gap-2 text-xs font-medium">
              <Link
                href="/track"
                className="rounded-sm px-3 py-1.5 text-[#252820] hover:bg-[#ECE9DF] transition-colors"
              >
                Track Report
              </Link>
              <Link
                href="/login"
                className="rounded-sm px-3 py-1.5 text-[#252820] hover:bg-[#ECE9DF] transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="rounded-sm bg-[#1B3A2E] px-3.5 py-1.5 text-[#F7F5EE] hover:bg-[#263D30] transition-colors"
              >
                Report an Issue
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
