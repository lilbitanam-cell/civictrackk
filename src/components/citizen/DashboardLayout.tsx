"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { getClientAuth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Bell,
  User,
  LogOut,
} from 'lucide-react';

const navItems = [
  { href: '/citizen/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/citizen/complaints', label: 'Complaints', icon: FileText },
  { href: '/citizen/report', label: 'Report', icon: PlusCircle },
  { href: '/citizen/notifications', label: 'Alerts', icon: Bell },
  { href: '/citizen/profile', label: 'Profile', icon: User },
];

function CitizenNavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col space-y-1">
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
            pathname === href
              ? 'bg-[#E9EDE4] text-[#30352D] font-medium'
              : 'text-[#74796F] hover:bg-[#F1F3EC] hover:text-[#30352D]'
          }`}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

function CitizenNavMobile() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E8DF] flex justify-around py-2 px-1 z-50 shadow-md">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center py-1 px-3 rounded-lg text-[11px] font-medium transition-colors ${
              isActive
                ? "text-[#3E4B37] bg-[#E9EDE4] font-semibold"
                : "text-[#74796F] hover:text-[#30352D]"
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      const auth = getClientAuth();
      await signOut(auth);
    } catch {}
    await fetch('/api/auth/session', { method: 'DELETE' });
    router.push('/login');
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F8F9F5]">
      {/* Mobile top bar */}
      <header className="md:hidden flex items-center justify-between bg-white border-b border-[#E5E8DF] px-4 py-3 sticky top-0 z-40">
        <div>
          <span className="font-semibold text-base text-[#30352D]">CivicTrack</span>
          <span className="text-xs text-[#788568] ml-2 font-medium bg-[#E9EDE4] px-2 py-0.5 rounded">Citizen</span>
        </div>
        <button
          onClick={handleSignOut}
          className="text-xs text-[#74796F] hover:text-[#30352D] flex items-center gap-1 border border-[#E5E8DF] px-2.5 py-1.5 rounded-md hover:bg-[#F1F3EC]"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </header>

      {/* Desktop sidebar */}
      <aside className="w-64 bg-white border-r border-[#E5E8DF] p-4 hidden md:flex md:flex-col shrink-0">
        <h2 className="text-xl font-semibold mb-6 text-[#30352D]">
          CivicTrack
        </h2>
        <div className="flex-1">
          <CitizenNavLinks />
        </div>
        <div className="mt-auto pt-4">
          <Button variant="outline" onClick={handleSignOut} className="w-full border-[#E5E8DF] text-[#30352D]">
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 overflow-y-auto max-w-full">
        {children}
      </main>

      {/* Mobile bottom navigation */}
      <CitizenNavMobile />
    </div>
  );
}
