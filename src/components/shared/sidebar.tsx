"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface SidebarItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
}

interface SidebarProps {
  items: SidebarItem[];
  headerTitle?: string;
  className?: string;
}

export function Sidebar({ items, headerTitle, className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex w-64 flex-col border-r border-[#E5E8DF] bg-white text-[#30352D]",
        className
      )}
    >
      {headerTitle && (
        <div className="px-4 py-3 border-b border-[#E5E8DF]">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#74796F]">
            {headerTitle}
          </h2>
        </div>
      )}
      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center justify-between rounded-md px-3 py-2 text-xs font-medium transition-colors",
                isActive
                  ? "bg-[#E9EDE4] text-[#3E4B37] font-semibold"
                  : "text-[#30352D] hover:bg-[#F1F3EC] hover:text-[#30352D]"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={cn(
                    "h-4 w-4 flex-shrink-0 transition-colors",
                    isActive
                      ? "text-[#3E4B37]"
                      : "text-[#74796F] group-hover:text-[#30352D]"
                  )}
                />
                <span>{item.title}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                    isActive
                      ? "bg-[#788568] text-white"
                      : "bg-[#F1F3EC] text-[#74796F]"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-[#E5E8DF]">
        <div className="rounded-md bg-[#F8F9F5] p-2.5 border border-[#E5E8DF] text-[11px] text-[#74796F]">
          <span className="font-semibold text-[#30352D] block mb-0.5">
            Department Support
          </span>
          Municipal Helpdesk: (555) 019-4820
        </div>
      </div>
    </aside>
  );
}
