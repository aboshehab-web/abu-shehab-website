import type { Metadata, Viewport } from "next";
import { Tajawal, Aref_Ruqaa } from "next/font/google";
import "./globals.css";

const body = Tajawal({ subsets: ["arabic", "latin"], weight: ["400", "500", "700", "800"], variable: "--font-body", display: "swap" });
const display = Aref_Ruqaa({ subsets: ["arabic", "latin"], weight: ["400", "700"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: "كبابجي أبو شهاب | مشويات مصرية على الفحم",
  description: "كبابجي أبو شهاب — مشويات مصرية على الفحم في بولاق الدكرور، الجيزة. اطلب بسهولة عبر واتساب.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0e0b09",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${body.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}
