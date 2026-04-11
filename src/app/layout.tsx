import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ToolLayout from "@/components/ToolLayout";
import SplashScreen from "@/components/SplashScreen";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://freetools.lk"),
  title: {
    default: "FreeTools.lk — Free Online Tools for Everyone",
    template: "%s | FreeTools.lk",
  },
  description:
    "Free online tools for PDF, images and video — no signup, no upload limits, 100% private. Merge, compress, convert, crop and more. Sri Lanka's #1 free tools platform.",
  keywords: [
    "free online tools", "pdf tools", "image tools", "video tools",
    "merge pdf", "compress pdf", "compress image", "convert video",
    "free tools sri lanka", "freetools.lk", "online tools",
  ],
  authors: [{ name: "KD Lanka (Pvt) Ltd", url: "https://freetools.lk" }],
  creator: "KD Lanka (Pvt) Ltd",
  publisher: "KD Lanka (Pvt) Ltd",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://freetools.lk",
    siteName: "FreeTools.lk",
    title: "FreeTools.lk — Free Online Tools for Everyone",
    description:
      "Free online tools for PDF, images and video — no signup, 100% private. Sri Lanka's #1 free tools platform.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "FreeTools.lk" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FreeTools.lk — Free Online Tools for Everyone",
    description:
      "Free online tools for PDF, images and video — no signup, 100% private.",
    images: ["/og-image.png"],
    creator: "@freetoolslk",
  },
  alternates: {
    canonical: "https://freetools.lk",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('freetools-theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark')}catch(e){}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://freetools.lk/#organization",
                  name: "KD Lanka (Pvt) Ltd",
                  url: "https://freetools.lk",
                  logo: { "@type": "ImageObject", url: "https://freetools.lk/freetoolslogo.png" },
                  contactPoint: { "@type": "ContactPoint", telephone: "+94117228328", email: "hello@kdj.lk", contactType: "customer support" },
                },
                {
                  "@type": "WebSite",
                  "@id": "https://freetools.lk/#website",
                  url: "https://freetools.lk",
                  name: "FreeTools.lk",
                  description: "Free online tools for PDF, images and video — no signup, 100% private.",
                  publisher: { "@id": "https://freetools.lk/#organization" },
                  potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: "https://freetools.lk/?q={search_term_string}" }, "query-input": "required name=search_term_string" },
                },
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-full antialiased bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <SplashScreen />
        <ToolLayout>{children}</ToolLayout>
      </body>
    </html>
  );
}
