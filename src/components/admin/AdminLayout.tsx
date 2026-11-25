"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/config";
import {
  LayoutDashboard, FileText, Building2, Users,
  Map, BarChart2, LogOut
} from "lucide-react";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/complaints", label: "Complaints", icon: FileText },
  { href: "/admin/departments", label: "Departments", icon: Building2 },
  { href: "/admin/workers", label: "Workers", icon: Users },
  { href: "/admin/map", label: "Map", icon: Map },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
];

function AdminNavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 flex-1">
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={`flex items-center gap-3 px-3 py-2 rounded-sm text-sm transition-colors ${
            pathname === href
              ? "bg-[#ECE9DF] text-[#1B3A2E] font-medium border-l-2 border-[#1B3A2E]"
              : "text-[#77796F] hover:bg-[#ECE9DF]/60 hover:text-[#252820]"
          }`}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

function AdminNavMobile() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#FAF8F2] border-t border-[#DDD9CE] flex overflow-x-auto py-2 px-1 z-50 justify-between">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center py-1 px-2.5 rounded-sm text-[11px] font-medium transition-colors shrink-0 ${
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(getClientAuth());
    } catch {}
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/login");
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F7F5EE]">
      {/* Mobile top bar */}
      <header className="md:hidden flex items-center justify-between bg-[#FAF8F2] border-b border-[#DDD9CE] px-4 py-2.5 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/logos/CivicTrack Watercolor Civic Emblem.png"
            alt="CivicTrack"
            className="h-9 w-auto object-contain mix-blend-multiply"
          />
          <span className="text-[10px] text-[#263D30] font-medium bg-[#ECE9DF] border border-[#DDD9CE] px-2 py-0.5 rounded-sm uppercase tracking-wider">Admin</span>
        </div>
        <button
          onClick={handleSignOut}
          className="text-xs text-[#77796F] hover:text-[#252820] flex items-center gap-1 border border-[#DDD9CE] px-2.5 py-1.5 rounded-sm hover:bg-[#ECE9DF]"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </header>

      {/* Desktop Sidebar */}
      <aside className="w-60 bg-[#FAF8F2] border-r border-[#DDD9CE] flex-col py-6 px-4 hidden md:flex shrink-0">
        <div className="mb-8 space-y-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/logos/CivicTrack Watercolor Civic Emblem.png"
            alt="CivicTrack"
            className="h-11 w-auto object-contain mix-blend-multiply"
          />
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#77796F] pl-0.5">Admin Console</p>
        </div>
        <AdminNavLinks />
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 text-sm text-[#77796F] hover:text-[#252820] hover:bg-[#ECE9DF] rounded-sm transition-colors mt-4"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 overflow-y-auto max-w-full">
        {children}
      </main>

      {/* Mobile bottom navigation */}
      <AdminNavMobile />
    </div>
  );
}
