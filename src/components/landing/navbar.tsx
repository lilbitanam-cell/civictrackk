"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Categories", href: "/#categories" },
  { label: "About", href: "/#about" },
  { label: "Contact", href: "/#contact" },
];

export function LandingNavbar() {
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E5E8DF] bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 select-none"
          onClick={() => setMenuOpen(false)}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#788568]">
            <MapPin className="h-5 w-5 text-white" strokeWidth={2} />
          </div>
          <div className="leading-none">
            <span className="block text-[15px] font-bold tracking-tight text-[#30352D]">
              CivicTrack
            </span>
            <span className="block text-[10px] font-medium tracking-widest text-[#74796F] uppercase mt-0.5">
              Municipal Services
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-[#30352D] hover:bg-[#F1F3EC] hover:text-[#30352D] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-2.5">
          <Link
            href="/login"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-[#30352D] hover:bg-[#F1F3EC] transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-[#788568] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#536247] transition-colors"
          >
            Report an Issue
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden rounded-md p-2 text-[#30352D] hover:bg-[#F1F3EC] transition-colors"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <div
        className={cn(
          "md:hidden border-t border-[#E5E8DF] bg-white overflow-hidden transition-all duration-200",
          menuOpen ? "max-h-[400px]" : "max-h-0"
        )}
      >
        <nav className="flex flex-col px-4 py-3 space-y-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-md px-3 py-2.5 text-sm font-medium text-[#30352D] hover:bg-[#F1F3EC] transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 pb-1 border-t border-[#E5E8DF] flex flex-col gap-2 mt-2">
            <Link
              href="/login"
              className="rounded-md px-3 py-2.5 text-sm font-medium text-[#30352D] border border-[#E5E8DF] text-center hover:bg-[#F1F3EC] transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-[#788568] px-3 py-2.5 text-sm font-semibold text-white text-center hover:bg-[#536247] transition-colors"
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
