import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { CivicAssistantWidget } from "@/components/shared/CivicAssistantWidget";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "CivicTrack — The Civic Journal & Municipal Issue Ledger",
  description:
    "An editorial public-service platform where residents document neighbourhood issues, follow municipal progress, and track verified civic improvements.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[#F7F5EE] text-[#252820] font-sans antialiased selection:bg-[#1B3A2E] selection:text-[#F7F5EE]">
        {children}
        <CivicAssistantWidget />
      </body>
    </html>
  );
}
