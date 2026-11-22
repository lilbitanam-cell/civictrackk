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
          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
            pathname === href
              ? "bg-[#E9EDE4] text-[#30352D] font-medium"
              : "text-[#74796F] hover:bg-[#F1F3EC] hover:text-[#30352D]"
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E8DF] flex overflow-x-auto py-2 px-1 z-50 shadow-md justify-between">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[11px] font-medium transition-colors shrink-0 ${
              isActive
                ? "text-[#3E4B37] bg-[#E9EDE4] font-semibold"
                : "text-[#74796F] hover:text-[#30352D]"
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
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F8F9F5]">
      {/* Mobile top bar */}
      <header className="md:hidden flex items-center justify-between bg-white border-b border-[#E5E8DF] px-4 py-3 sticky top-0 z-40">
        <div>
          <span className="font-semibold text-base text-[#30352D]">CivicTrack</span>
          <span className="text-xs text-[#536247] ml-2 font-medium bg-[#E9EDE4] px-2 py-0.5 rounded">Admin</span>
        </div>
        <button
          onClick={handleSignOut}
          className="text-xs text-[#74796F] hover:text-[#30352D] flex items-center gap-1 border border-[#E5E8DF] px-2.5 py-1.5 rounded-md hover:bg-[#F1F3EC]"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </header>

      {/* Desktop Sidebar */}
      <aside className="w-60 bg-white border-r border-[#E5E8DF] flex-col py-6 px-4 hidden md:flex shrink-0">
        <div className="mb-8">
          <span className="text-lg font-semibold text-[#30352D]">CivicTrack</span>
          <p className="text-xs text-[#74796F] mt-0.5">Admin Console</p>
        </div>
        <AdminNavLinks />
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 text-sm text-[#74796F] hover:text-[#30352D] hover:bg-[#F1F3EC] rounded-md transition-colors mt-4"
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
