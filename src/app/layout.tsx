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
  title: "FreeTools.lk — Simple tools for everyone",
  description:
    "Free online tools for PDF, images, text, and developers. Fast, clean, and easy to use.",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
    shortcut: "/icon.png",
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
      </head>
      <body className="min-h-full antialiased bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <SplashScreen />
        <ToolLayout>{children}</ToolLayout>
      </body>
    </html>
  );
}
