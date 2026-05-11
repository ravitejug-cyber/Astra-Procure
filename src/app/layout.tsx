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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  try{
    var keys=Object.keys(localStorage);
    for(var i=0;i<keys.length;i++){
      if(keys[i].indexOf('astra-procure')===0) localStorage.removeItem(keys[i]);
    }
  }catch(e){}
  var _b=window.btoa.bind(window);
  window.btoa=function(s){
    if(typeof s!=='string')return _b(s);
    var o='';for(var i=0;i<s.length;i++){var c=s.charCodeAt(i);o+=c>255?'?':s[i];}
    return _b(o);
  };
})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50">{children}</body>
    </html>
  );
}
