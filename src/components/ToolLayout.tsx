"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CATEGORIES, TOOLS, CAT_LABEL } from "@/lib/tools";

type Theme = "light" | "dark";

function toggleTheme() {
  const next: Theme =
    document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  try { localStorage.setItem("freetools-theme", next); } catch { /* ignore */ }
}

export default function ToolLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* active tool / category */
  const activeTool = TOOLS.find((t) => `/${t.id}` === pathname);
  const isHome = pathname === "/";

  return (
    <div className="flex min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">

      {/* ── Sidebar ─────────────────────────────────── */}
      <aside className="hidden lg:flex w-56 xl:w-64 shrink-0 flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0d1117]">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 transition-colors">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-rose-500 flex items-center justify-center text-white text-xs font-bold shadow shrink-0">
            FT
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-none truncate">FreeTools.lk</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              Simple tools for everyone
            </p>
          </div>
        </Link>

        {/* Category label */}
        <div className="px-5 pt-4 pb-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600">
            Categories
          </p>
        </div>

        {/* Category nav */}
        <nav className="px-2 pb-2 space-y-0.5">
          {CATEGORIES.map((cat) => {
            const active = isHome && cat.id === "all";
            const count = cat.id === "all" ? TOOLS.length : TOOLS.filter((t) => t.category === cat.id).length;
            return (
              <Link
                key={cat.id}
                href="/"
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-red-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </span>
                <span className={`text-xs tabular-nums font-semibold ${active ? "text-red-200" : "text-slate-400 dark:text-slate-600"}`}>
                  {count}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Tools label */}
        <div className="px-5 pt-3 pb-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600">
            PDF Tools
          </p>
        </div>

        {/* Tool links */}
        <nav className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
          {TOOLS.map((tool) => {
            const active = activeTool?.id === tool.id;
            return (
              <Link
                key={tool.id}
                href={`/${tool.id}`}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  tool.soon
                    ? "opacity-40 pointer-events-none text-slate-500 dark:text-slate-500"
                    : active
                    ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <span className="text-base leading-none shrink-0">{tool.icon}</span>
                <span className="truncate">{tool.name}</span>
                {tool.soon && <span className="ml-auto text-[10px] text-slate-400">soon</span>}
                {tool.isNew && !tool.soon && <span className="ml-auto text-[10px] font-bold text-rose-500">NEW</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: stats + theme */}
        <div className="px-3 py-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 transition-colors"
          >
            <span className="dark:hidden">Enable dark mode</span>
            <span className="hidden dark:block">Switch to light</span>
            <span className="text-base leading-none dark:hidden">🌙</span>
            <span className="text-base leading-none hidden dark:block">☀️</span>
          </button>
        </div>
      </aside>

      {/* ── Main area ─────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">

        {/* Sticky top bar (mobile + desktop) */}
        <header className="sticky top-0 z-20 flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md">

          {/* Mobile logo */}
          <Link href="/" className="lg:hidden flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-600 to-rose-500 flex items-center justify-center text-white text-[10px] font-bold shadow">
              FT
            </div>
            <span className="text-sm font-bold">FreeTools.lk</span>
          </Link>

          {/* Breadcrumb (on tool pages) */}
          {activeTool && (
            <div className="hidden lg:flex items-center gap-2 text-sm">
              <Link href="/" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                Home
              </Link>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{activeTool.name}</span>
            </div>
          )}

          <div className="flex-1" />

          {/* Mobile menu button */}
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            title="Toggle theme"
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="text-sm dark:hidden">🌙</span>
            <span className="text-sm hidden dark:block">☀️</span>
          </button>
        </header>

        {/* Mobile drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0d1117] px-3 py-3 space-y-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-3 pb-1">PDF Tools</p>
            {TOOLS.map((tool) => (
              <Link
                key={tool.id}
                href={`/${tool.id}`}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  tool.soon
                    ? "opacity-40 pointer-events-none text-slate-500"
                    : activeTool?.id === tool.id
                    ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800"
                }`}
              >
                <span>{tool.icon}</span>
                <span>{tool.name}</span>
                {tool.soon && <span className="ml-auto text-[10px] text-slate-400">soon</span>}
                {tool.isNew && !tool.soon && <span className="ml-auto text-[10px] font-bold text-rose-500">NEW</span>}
              </Link>
            ))}
          </div>
        )}

        {/* Page content */}
        <div className="flex-1 flex flex-col">
          {children}
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            © {new Date().getFullYear()} FreeTools.lk — Simple tools for everyone
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
            <span>
              Powered by{" "}
              <span className="font-semibold text-slate-600 dark:text-slate-300">KDJ Lanka (Pvt) Ltd</span>
            </span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
            <span>
              Hotline:{" "}
              <a href="tel:+940117228328" className="font-semibold text-red-600 dark:text-red-400 hover:underline">
                0117 228 328
              </a>
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
