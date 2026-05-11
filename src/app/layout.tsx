import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "AstraProcure — Aluminium Housing Costing Intelligence",
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
        {/* Patch btoa to tolerate non-Latin1 chars (U+2022 etc.) from React internals */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var b=window.btoa.bind(window);window.btoa=function(s){return b(s.replace(/[^\\x00-\\xFF]/g,'?'));};})();`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
