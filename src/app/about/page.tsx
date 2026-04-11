import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About FreeTools.lk — Free Online Tools by KD Lanka (Pvt) Ltd",
  description: "FreeTools.lk is a free online tools platform built by KD Lanka (Pvt) Ltd. Fast, private, browser-based PDF, image and video tools for everyone in Sri Lanka and beyond.",
  keywords: ["freetools.lk", "free tools sri lanka", "kd lanka", "online tools", "pdf tools", "image tools", "video tools"],
  openGraph: { title: "About FreeTools.lk", description: "Free online tools platform by KD Lanka (Pvt) Ltd — for Sri Lanka and the world.", url: "https://freetools.lk/about", type: "website" },
  twitter: { card: "summary", title: "About FreeTools.lk", description: "Free online tools by KD Lanka (Pvt) Ltd." },
  alternates: { canonical: "https://freetools.lk/about" },
};


export default function AboutPage() {
  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-12">

      {/* Hero */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/25 mb-5">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path d="M9 9h14a7 7 0 0 1 0 14H9V9z" fill="white" fillOpacity="0.95"/>
            <path d="M9 23h9v7H9v-7z" fill="white" fillOpacity="0.7"/>
          </svg>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100">
          About <span className="text-red-600">FreeTools.lk</span>
        </h1>
        <p className="mt-3 text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
          Free, fast, and private online tools — built for Sri Lanka, open to the world.
        </p>
      </div>

      {/* Mission */}
      <section className="mb-10 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 bg-slate-50 dark:bg-slate-900/50">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <span>🎯</span> Our Mission
        </h2>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
          FreeTools.lk exists to give everyone access to powerful productivity tools without subscriptions, 
          sign-ups, or file uploads. Every tool runs entirely in your browser — your files never leave your 
          device. We believe great software should be accessible to everyone, whether you're a student 
          in Colombo, a freelancer in Kandy, or a professional anywhere in the world.
        </p>
      </section>

      {/* Why different */}
      <section className="mb-10">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span>⚡</span> Why FreeTools.lk is Different
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              icon: "🔒",
              title: "100% Private",
              desc: "All processing happens in your browser. Your files are never uploaded to any server.",
            },
            {
              icon: "🚀",
              title: "Blazing Fast",
              desc: "Near-native speed for PDF and image operations — all processing happens right in your browser.",
            },
            {
              icon: "🆓",
              title: "Always Free",
              desc: "No subscriptions, no hidden fees, no sign-up required. Just open and use.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900">
              <span className="text-2xl block mb-2">{f.icon}</span>
              <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About KD Lanka */}
      <section className="mb-10 rounded-2xl border border-red-100 dark:border-red-900/40 p-6 sm:p-8 bg-red-50/50 dark:bg-red-950/10">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-lg shadow">
            KD
          </div>
          <div>
            <h2 className="text-lg font-bold mb-1">KD Lanka (Pvt) Ltd</h2>
            <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-3">
              Building technology for Sri Lanka
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-3">
              FreeTools.lk is proudly built and maintained by <strong>KD Lanka (Pvt) Ltd</strong> — 
              a Sri Lankan technology company dedicated to creating modern digital solutions. 
              We build platforms, tools, and services that empower individuals and businesses across 
              the island and beyond.
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              From enterprise software to free community tools like this platform, our goal is simple: 
              deliver technology that makes a real difference in people's daily lives.
            </p>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="mb-10">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span>📬</span> Get in Touch
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <a
            href="tel:+940117228328"
            className="group flex items-center gap-4 rounded-xl border border-slate-200 dark:border-slate-800 px-5 py-4 bg-white dark:bg-slate-900 hover:border-red-300 dark:hover:border-red-800 hover:shadow-sm transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-xl shrink-0">
              📞
            </div>
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">Hotline</p>
              <p className="font-bold text-red-600 dark:text-red-400 group-hover:underline">
                0117 228 328
              </p>
            </div>
          </a>
          <a
            href="mailto:hello@kdj.lk"
            className="group flex items-center gap-4 rounded-xl border border-slate-200 dark:border-slate-800 px-5 py-4 bg-white dark:bg-slate-900 hover:border-red-300 dark:hover:border-red-800 hover:shadow-sm transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-xl shrink-0">
              ✉️
            </div>
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">Email</p>
              <p className="font-bold text-red-600 dark:text-red-400 group-hover:underline">
                hello@kdj.lk
              </p>
            </div>
          </a>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center pt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors shadow shadow-red-500/20"
        >
          ← Back to Tools
        </Link>
        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
          Made with ❤️ in Sri Lanka 🇱🇰
        </p>
      </div>

    </main>
  );
}
