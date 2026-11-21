import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CivicTrack — Municipal Issue Reporting & Resolution",
  description: "A clean, reliable civic issue reporting and municipal management platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-[#F8F9F5] text-[#30352D] antialiased">
        {children}
      </body>
    </html>
  );
}
