import Link from "next/link";

const FOOTER_LINKS = {
  Journal: [
    { label: "Civic Stories", href: "/stories" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Issue Categories", href: "/#categories" },
    { label: "Track a Report", href: "/track" },
  ],
  Portals: [
    { label: "Report an Issue", href: "/citizen/report" },
    { label: "Citizen Dashboard", href: "/citizen/dashboard" },
    { label: "Municipal Admin", href: "/admin/dashboard" },
    { label: "Field Worker", href: "/worker/dashboard" },
  ],
  Institution: [
    { label: "About CivicTrack", href: "/#about" },
    { label: "Sign In", href: "/login" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Use", href: "/terms" },
  ],
};

export function LandingFooter() {
  return (
    <footer
      id="contact"
      className="border-t border-[#DDD9CE] bg-[#F7F5EE] pt-14"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Top directory */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-10 border-b border-[#DDD9CE]">
          <div className="md:col-span-1 space-y-4">
            <Link
              href="/"
              className="inline-block"
              aria-label="CivicTrack — The Civic Journal"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/logos/CivicTrack Watercolor Civic Emblem.png"
                alt="CivicTrack"
                className="h-12 w-auto object-contain mix-blend-multiply"
                loading="lazy"
              />
            </Link>
            <p className="text-xs text-[#77796F] leading-relaxed max-w-[220px]">
              An editorial public-service ledger connecting residents with
              municipal departments for verified issue resolution.
            </p>
            <div className="pt-1 space-y-1 text-xs text-[#77796F]">
              <p className="font-semibold text-[#252820]">Municipal Helpdesk</p>
              <p>support@civictrack.in</p>
              <p>(011) 4000-0000 · Mon–Sat</p>
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group}>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1B3A2E]">
                {group}
              </p>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-xs text-[#77796F] hover:text-[#1B3A2E] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Colophon row */}
        <div className="py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#77796F]">
          <p>&copy; 2026 CivicTrack. Public Grievance &amp; Civic Ledger.</p>
          <p className="text-center sm:text-right">
            Built for transparent municipal governance and neighbourhood care.
          </p>
        </div>
      </div>

      {/* Panoramic Footer Landscape Illustration */}
      <div className="w-full overflow-hidden pt-2">
        <div className="mx-auto max-w-7xl px-2 sm:px-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/illustrations/civic-footer-landscape.png"
            alt="Panoramic illustration of municipal civic hall, trees, bench, and streetlamp"
            className="w-full h-auto max-h-[220px] object-contain object-bottom mix-blend-multiply select-none"
            loading="lazy"
          />
        </div>
      </div>
    </footer>
  );
}
