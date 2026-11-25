import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";

const pixel = Press_Start_2P({ weight: "400", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "Balan",
  description: "Balan'ın sitesi",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className={pixel.className}>{children}</body>
    </html>
  );
}