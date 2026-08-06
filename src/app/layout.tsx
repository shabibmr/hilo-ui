import type { Metadata } from "next";
import { Playfair_Display, Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-accent",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "HILO ARTE — Luxury Embroidery Experiences & DIY Kits",
  description: "Beginner embroidery experiences designed to slow down and create. Handcrafted luxury kits, guided lessons, and slow-living art in India.",
  keywords: ["Embroidery Kits", "Luxury DIY Kits", "Beginner Embroidery", "Handcrafted India", "Slow Living", "HILO ARTE"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${cormorant.variable} ${plusJakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream-warm text-wine font-body selection:bg-gold/20 selection:text-wine">
        <div className="paper-grain" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
