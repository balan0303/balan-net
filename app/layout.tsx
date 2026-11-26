import type { Metadata } from "next";
import localFont from "next/font/local";
import { Pixelify_Sans } from "next/font/google";
import "./globals.css";

const alagard = localFont({
  src: "./fonts/alagard.ttf",
  variable: "--font-alagard",
});

// Alagard'da eksik olan harfler (ğ, ş, İ gibi) için yedek font
const fallback = Pixelify_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-fallback",
});

export const metadata: Metadata = {
  title: "Balan",
  description: "Balan'ın sitesi",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className={`${alagard.variable} ${fallback.variable}`}>{children}</body>
    </html>
  );
}