"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Categories", href: "/#categories" },
  { label: "Civic Stories", href: "/stories" },
  { label: "About", href: "/#about" },
];

export function LandingNavbar() {
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#DDD9CE] bg-[#F7F5EE]/95 backdrop-blur-[2px]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* CivicTrack Editorial Identity */}
        <Link
          href="/"
          className="flex items-center select-none group"
          onClick={() => setMenuOpen(false)}
          aria-label="CivicTrack — The Civic Journal"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/logos/CivicTrack Watercolor Civic Emblem.png"
            alt="CivicTrack"
            className="h-11 sm:h-12 w-auto object-contain mix-blend-multiply"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-sm px-3 py-1.5 text-sm font-medium text-[#252820] hover:bg-[#ECE9DF] hover:text-[#1B3A2E] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-2.5">
          <Link
            href="/track"
            className="rounded-sm px-3 py-1.5 text-xs font-medium text-[#77796F] hover:text-[#1B3A2E] transition-colors"
          >
            Track Report
          </Link>
          <Link
            href="/login"
            className="rounded-sm border border-[#DDD9CE] bg-[#FAF8F2] px-3.5 py-1.5 text-sm font-medium text-[#252820] hover:bg-[#ECE9DF] transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/citizen/report"
            className="rounded-sm bg-[#1B3A2E] px-4 py-1.5 text-sm font-medium text-[#F7F5EE] hover:bg-[#263D30] transition-colors"
          >
            Report an Issue
          </Link>
        </div>

        {/* Mobile / Tablet Menu Toggle */}
        <button
          type="button"
          className="lg:hidden rounded-sm p-2 text-[#252820] hover:bg-[#ECE9DF] transition-colors"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile / Tablet Drawer */}
      <div
        className={cn(
          "lg:hidden border-t border-[#DDD9CE] bg-[#F7F5EE] overflow-hidden transition-all duration-200",
          menuOpen ? "max-h-[460px]" : "max-h-0 border-t-0"
        )}
      >
        <nav className="flex flex-col px-4 py-3 space-y-1" aria-label="Mobile navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-sm px-3 py-2.5 text-sm font-medium text-[#252820] hover:bg-[#ECE9DF] transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/track"
            className="rounded-sm px-3 py-2.5 text-sm font-medium text-[#252820] hover:bg-[#ECE9DF] transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            Track a Report
          </Link>
          <div className="pt-3 pb-1 border-t border-[#DDD9CE] flex flex-col gap-2 mt-2">
            <Link
              href="/login"
              className="rounded-sm px-3 py-2.5 text-sm font-medium text-[#252820] border border-[#DDD9CE] bg-[#FAF8F2] text-center hover:bg-[#ECE9DF] transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Log In
            </Link>
            <Link
              href="/citizen/report"
              className="rounded-sm bg-[#1B3A2E] px-3 py-2.5 text-sm font-medium text-[#F7F5EE] text-center hover:bg-[#263D30] transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Report an Issue
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
