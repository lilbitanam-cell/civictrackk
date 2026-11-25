"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { getClientAuth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, ClipboardList, User, LogOut
} from "lucide-react";

const navItems = [
  { href: '/worker/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/worker/tasks', label: 'My Tasks', icon: ClipboardList },
  { href: '/worker/profile', label: 'Profile', icon: User },
];

function WorkerNavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 flex-1">
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-colors ${pathname === href
              ? "bg-[#ECE9DF] text-[#1B3A2E] border-l-2 border-[#1B3A2E]"
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

function WorkerNavMobile() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#FAF8F2] border-t border-[#DDD9CE] flex justify-around py-2 px-2 z-50">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center py-1.5 px-4 rounded-sm text-xs font-medium transition-colors min-w-[72px] ${isActive
                ? "text-[#1B3A2E] bg-[#ECE9DF] font-semibold"
                : "text-[#77796F] hover:text-[#252820]"
              }`}
          >
            <Icon className="h-5 w-5 mb-0.5" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      const auth = getClientAuth();
      await signOut(auth);
    } catch { }
    await fetch('/api/auth/session', { method: 'DELETE' });
    router.push('/login');
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
          <span className="text-[10px] text-[#263D30] font-medium bg-[#ECE9DF] border border-[#DDD9CE] px-2 py-0.5 rounded-sm uppercase tracking-wider">Worker</span>
        </div>
        <button
          onClick={handleSignOut}
          className="text-xs text-[#77796F] hover:text-[#252820] flex items-center gap-1 border border-[#DDD9CE] px-2.5 py-1.5 rounded-sm hover:bg-[#ECE9DF]"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </header>

      {/* Desktop sidebar */}
      <aside className="w-60 bg-[#FAF8F2] border-r border-[#DDD9CE] flex-col py-6 px-4 hidden md:flex shrink-0">
        <div className="mb-8 space-y-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/logos/CivicTrack Watercolor Civic Emblem.png"
            alt="CivicTrack"
            className="h-11 w-auto object-contain mix-blend-multiply"
          />
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#77796F] pl-0.5">Worker Panel</p>
        </div>
        <WorkerNavLinks />
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
      <WorkerNavMobile />
    </div>
  );
}
