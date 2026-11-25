"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signOut } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/config";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Bell,
  User,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/citizen/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/citizen/complaints", label: "My Reports", icon: FileText },
  { href: "/citizen/report", label: "Report Issue", icon: PlusCircle },
  { href: "/citizen/notifications", label: "Alerts", icon: Bell },
  { href: "/citizen/profile", label: "Profile", icon: User },
];

function CitizenNavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col space-y-1">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-sm text-sm transition-colors ${
              active
                ? "bg-[#1B3A2E] text-[#F7F5EE] font-medium"
                : "text-[#77796F] hover:bg-[#ECE9DF] hover:text-[#252820]"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function CitizenNavMobile() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#FAF8F2] border-t border-[#DDD9CE] flex justify-around py-2 px-1 z-50">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center py-1 px-2.5 rounded-sm text-[11px] font-medium transition-colors ${
              isActive
                ? "text-[#1B3A2E] bg-[#ECE9DF] font-semibold"
                : "text-[#77796F] hover:text-[#252820]"
            }`}
          >
            <Icon className="h-4 w-4 mb-0.5" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      const auth = getClientAuth();
      await signOut(auth);
    } catch {}
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/login");
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F7F5EE] text-[#252820]">
      {/* Mobile top bar */}
      <header className="md:hidden flex items-center justify-between bg-[#FAF8F2] border-b border-[#DDD9CE] px-4 py-2.5 sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/logos/CivicTrack Watercolor Civic Emblem.png"
            alt="CivicTrack"
            className="h-9 w-auto object-contain mix-blend-multiply"
          />
          <span className="text-[10px] text-[#718267] uppercase tracking-wider font-semibold bg-[#ECE9DF] px-2 py-0.5 rounded-sm">
            Citizen
          </span>
        </Link>
        <button
          onClick={handleSignOut}
          className="text-xs text-[#77796F] hover:text-[#252820] flex items-center gap-1 border border-[#DDD9CE] px-2.5 py-1.5 rounded-sm hover:bg-[#ECE9DF]"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </header>

      {/* Desktop sidebar */}
      <aside className="w-64 bg-[#FAF8F2] border-r border-[#DDD9CE] p-5 hidden md:flex md:flex-col shrink-0">
        <Link href="/" className="block mb-8 space-y-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/logos/CivicTrack Watercolor Civic Emblem.png"
            alt="CivicTrack"
            className="h-11 w-auto object-contain mix-blend-multiply"
          />
          <span className="block text-[9px] uppercase tracking-[0.18em] text-[#77796F] pl-0.5">
            Citizen Ledger
          </span>
        </Link>
        <div className="flex-1">
          <CitizenNavLinks />
        </div>
        <div className="mt-auto pt-4 border-t border-[#DDD9CE] space-y-2">
          <Link
            href="/stories"
            className="block text-xs text-[#718267] hover:text-[#1B3A2E] px-2 py-1"
          >
            View Public Civic Stories →
          </Link>
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="w-full"
          >
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto max-w-full">
        {children}
      </main>

      {/* Mobile bottom navigation */}
      <CitizenNavMobile />
    </div>
  );
}
