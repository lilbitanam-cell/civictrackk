import Link from "next/link";
import { MapPin } from "lucide-react";

const FOOTER_LINKS = {
  Platform: [
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Issue Categories", href: "/#categories" },
    { label: "Report an Issue", href: "/register" },
    { label: "Track My Report", href: "/login" },
  ],
  Portals: [
    { label: "Citizen Dashboard", href: "/citizen/dashboard" },
    { label: "Municipal Admin", href: "/admin/dashboard" },
    { label: "Field Worker", href: "/worker/dashboard" },
    { label: "Sign In", href: "/login" },
  ],
  About: [
    { label: "About CivicTrack", href: "/#about" },
    { label: "Contact Us", href: "/#contact" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Use", href: "/terms" },
  ],
};

export function LandingFooter() {
  return (
    <footer
      id="contact"
      className="border-t border-[#E5E8DF] bg-white px-4 sm:px-6 pt-10 pb-6"
    >
      <div className="mx-auto max-w-6xl">

        {/* Top row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-[#E5E8DF]">

          {/* Brand column */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#788568]">
                <MapPin className="h-4 w-4 text-white" strokeWidth={2} />
              </div>
              <div className="leading-none">
                <span className="block text-sm font-bold tracking-tight text-[#30352D]">
                  CivicTrack
                </span>
                <span className="block text-[10px] font-medium tracking-widest text-[#74796F] uppercase mt-0.5">
                  Municipal Services
                </span>
              </div>
            </Link>
            <p className="text-xs text-[#74796F] leading-relaxed max-w-[200px]">
              Connecting residents with municipal departments for faster issue resolution.
            </p>
            <div className="mt-5 space-y-1 text-xs text-[#74796F]">
              <p className="font-semibold text-[#30352D]">Municipal Helpdesk</p>
              <p>support@civictrack.in</p>
              <p>(011) 4000-0000</p>
              <p>Mon – Sat, 9 AM – 6 PM</p>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group}>
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#30352D]">
                {group}
              </p>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-xs text-[#74796F] hover:text-[#30352D] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#74796F]">
          <p>
            &copy; 2026 CivicTrack. A civic infrastructure management platform.
          </p>
          <p className="text-center sm:text-right">
            Built to serve Indian municipalities and their residents.
          </p>
        </div>
      </div>
    </footer>
  );
}
