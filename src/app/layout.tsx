import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AstraProcure - Aluminium Housing Costing Intelligence",
  description:
    "AI-powered manufacturing cost estimation for aluminium housings. Upload engineering drawings and get instant cost breakdowns, process analysis, and DFM insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50">
        {/*
          Secondary defence: patches window.btoa before React scripts load so
          any U+2022 char reaching applyViewTransitionName is safely filtered.
          Primary fix is the postinstall script that patches btoa() directly
          inside the react-dom CJS files consumed by Turbopack.
        */}
        <Script strategy="beforeInteractive" src="/btoa-patch.js" />
        {children}
      </body>
    </html>
  );
}
