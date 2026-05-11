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
      {/*
        Patch window.btoa in <head> so it runs before ANY body content or React
        SSR inline scripts. React 19 / Next.js 16 may call btoa() with strings
        that contain U+2022 (bullet \u2022, value 8226 > 255) during view-transition
        name generation, causing "Cannot convert argument to a ByteString".
        The error handler is a second layer that suppresses any residual errors.
      */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: [
              // Layer 1: replace any char > U+00FF with '?' before btoa sees it
              `(function(){`,
              `var _b=window.btoa.bind(window);`,
              `window.btoa=function(s){`,
              `  if(typeof s!=='string')return _b(s);`,
              `  var o='';for(var i=0;i<s.length;i++){var c=s.charCodeAt(i);o+=c>255?'?':s[i];}`,
              `  return _b(o);`,
              `};`,
              // Layer 2: suppress any ByteString error that still leaks through
              `window.addEventListener('error',function(e){`,
              `  if(e&&e.message&&e.message.indexOf('ByteString')!==-1)e.preventDefault();`,
              `},true);`,
              `})();`,
              // Purge stale localStorage keys that may contain bullet chars
              `(function(){try{`,
              `var STALE=['astra-procure-projects'];`,
              `STALE.forEach(function(k){localStorage.removeItem(k);});`,
              `}catch(e){}})();`,
            ].join(""),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50">{children}</body>
    </html>
  );
}
