"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

/* ─── Types ─────────────────────────────────────────────────────── */

type CategoryId = "all" | "pdf";

type Tool = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: Exclude<CategoryId, "all">;
  popular?: boolean;
  soon?: boolean;
  isNew?: boolean;
};

/* ─── Data ──────────────────────────────────────────────────────── */

const CATEGORIES: { id: CategoryId; label: string; emoji: string }[] = [
  { id: "all", label: "All tools", emoji: "⚡" },
  { id: "pdf", label: "PDF Tools", emoji: "📄" },
];

const CAT_LABEL: Record<CategoryId, string> = {
  all: "All",
  pdf: "PDF",
};

const CAT_CHIP: Record<Exclude<CategoryId, "all">, string> = {
  pdf: "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300",
};

const TOOLS: Tool[] = [
  { id: "merge-pdf",     name: "Merge PDF",       icon: "🔗", description: "Combine multiple PDF files into one document in seconds.",        category: "pdf", popular: true },
  { id: "split-pdf",     name: "Split PDF",        icon: "✂️", description: "Extract pages or split a PDF into multiple separate files.",       category: "pdf", popular: true },
  { id: "compress-pdf",  name: "Compress PDF",     icon: "📦", description: "Reduce PDF file size while keeping the best possible quality.",    category: "pdf", popular: true },
  { id: "pdf-to-jpg",    name: "PDF to JPG",       icon: "🖼️", description: "Convert every PDF page into a high-quality JPG image.",            category: "pdf" },
  { id: "jpg-to-pdf",    name: "JPG to PDF",       icon: "📎", description: "Turn one or more images into a single PDF document.",              category: "pdf" },
  { id: "rotate-pdf",    name: "Rotate PDF",       icon: "🔄", description: "Fix page orientation — rotate any page to the right angle.",       category: "pdf" },
  { id: "watermark-pdf", name: "Watermark PDF",    icon: "💧", description: "Stamp a custom text or image watermark on every page.",            category: "pdf" },
  { id: "protect-pdf",   name: "Protect PDF",      icon: "🔒", description: "Lock your PDF with a password to keep it private.",               category: "pdf" },
  { id: "unlock-pdf",    name: "Unlock PDF",       icon: "🔓", description: "Remove the password from a PDF you own.",                          category: "pdf" },
  { id: "reorder-pdf",   name: "Reorder Pages",    icon: "🗂️", description: "Drag and drop pages to rearrange them in any order.",              category: "pdf", isNew: true },
];

/* ─── Theme helper (no React state — touches the DOM directly) ──── */

function applyTheme(next: "light" | "dark") {
  document.documentElement.setAttribute("data-theme", next);
  try { localStorage.setItem("freetools-theme", next); } catch { /* ignore */ }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  applyTheme(current === "dark" ? "light" : "dark");
}

/* ─── Component ─────────────────────────────────────────────────── */

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("all");
  const [query, setQuery] = useState("");

  /* category counts */
  const counts = useMemo<Partial<Record<CategoryId, number>>>(() => {
    const out: Partial<Record<CategoryId, number>> = { all: TOOLS.length };
    for (const t of TOOLS) out[t.category] = (out[t.category] ?? 0) + 1;
    return out;
  }, []);

  /* filtered tool list */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TOOLS.filter((t) => {
      if (activeCategory !== "all" && t.category !== activeCategory) return false;
      if (q && !t.name.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [activeCategory, query]);

  return (
    <div className="flex min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">

      {/* ── Sidebar (desktop) ─────────────────────────── */}
      <aside className="hidden lg:flex w-56 xl:w-64 shrink-0 flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0d1117]">

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-rose-500 flex items-center justify-center text-white text-xs font-bold shadow">
            FT
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              Simple tools for everyone
            </p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-2 pt-3 pb-2 space-y-0.5">
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
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
                  {counts[cat.id]}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar stats + theme */}
        <div className="px-3 py-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <div className="px-3 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wide">Total tools</p>
            <p className="text-2xl font-black mt-0.5 text-slate-900 dark:text-white">{TOOLS.length}</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              across {CATEGORIES.length - 1} PDF categories
            </p>
          </div>

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

      {/* ── Main area ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">

        {/* Sticky header */}
        <header className="sticky top-0 z-20 flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-600 to-rose-500 flex items-center justify-center text-white text-[10px] font-bold">
              FT
            </div>
            <span className="text-sm font-bold">FreeTools.lk</span>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="M21 21l-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tools…"
              className="w-full h-9 pl-9 pr-4 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
            />
          </div>

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

        {/* Mobile category tabs */}
        <div className="lg:hidden flex gap-2 overflow-x-auto px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                activeCategory === cat.id
                  ? "bg-red-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {cat.emoji} {cat.label}
              <span className="ml-1 opacity-50">{counts[cat.id]}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <main className="flex-1 px-4 sm:px-6 py-6">

          {/* Section heading */}
          <div className="mb-6">
            <h1 className="text-xl font-bold">
              {activeCategory === "all" ? "All tools" : CAT_LABEL[activeCategory]}
            </h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              {filtered.length} {filtered.length === 1 ? "tool" : "tools"}
              {query
                ? ` matching "${query}"`
                : activeCategory !== "all"
                  ? ` in ${CAT_LABEL[activeCategory]}`
                  : " — all PDF tools"}
            </p>
          </div>

          {/* Tool cards */}
          {filtered.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filtered.map((tool) => (
                <article
                  key={tool.id}
                  className={`flex flex-col gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-red-200 dark:hover:border-red-900 hover:shadow-sm transition-all ${tool.soon ? "opacity-50" : ""}`}
                >
                  {/* Icon + badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-2xl leading-none">{tool.icon}</span>
                    <div className="flex items-center gap-1.5">
                      {tool.isNew && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300">
                          New
                        </span>
                      )}
                      {tool.popular && !tool.soon && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300">
                          Popular
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Name + description */}
                  <div className="flex-1">
                    <h2 className="font-semibold text-slate-900 dark:text-white leading-snug">
                      {tool.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      {tool.description}
                    </p>
                  </div>

                  {/* CTA */}
                  <div>
                    {tool.soon ? (
                      <span className="inline-block text-xs font-medium text-slate-400 dark:text-slate-500 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        Coming soon
                      </span>
                    ) : (
                      <Link
                        href={`/${tool.id}`}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                      >
                        Open tool
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <span className="text-4xl mb-3">🔍</span>
              <p className="font-semibold">No tools found</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Try a keyword like &ldquo;merge&rdquo;, &ldquo;resize&rdquo;, or &ldquo;json&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => setQuery("")}
                className="mt-4 text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                Clear search
              </button>
            </div>
          )}
        </main>

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
