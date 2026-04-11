"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CATEGORIES, TOOLS, CAT_LABEL, type CategoryId } from "@/lib/tools";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const out: Partial<Record<CategoryId, number>> = { all: TOOLS.length };
    for (const t of TOOLS) out[t.category] = (out[t.category] ?? 0) + 1;
    return out;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TOOLS.filter((t) => {
      if (activeCategory !== "all" && t.category !== activeCategory) return false;
      if (q && !t.name.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [activeCategory, query]);

  return (
    <main className="flex-1 flex flex-col">

      {/* Search bar */}
      <div className="px-4 sm:px-6 pt-6 pb-4">
        <div className="relative max-w-lg">
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" d="M21 21l-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools…"
            className="w-full h-10 pl-9 pr-4 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
          />
        </div>
      </div>

      {/* Mobile category tabs */}
      <div className="lg:hidden flex gap-2 overflow-x-auto px-4 pb-3 shrink-0">
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
            <span className="ml-1 opacity-60">{counts[cat.id]}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 px-4 sm:px-6 pb-6">

        {/* Heading */}
        <div className="mb-5">
          <h1 className="text-xl font-bold">
            {activeCategory === "all" ? "All Tools" : CAT_LABEL[activeCategory] + " Tools"}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {filtered.length} {filtered.length === 1 ? "tool" : "tools"}
            {query ? ` matching "${query}"` : " — all free, runs in your browser"}
          </p>
        </div>

        {/* Tool grid */}
        {filtered.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((tool) => (
              <article
                key={tool.id}
                className={`flex flex-col gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all ${
                  tool.soon
                    ? "opacity-50"
                    : "hover:border-red-200 dark:hover:border-red-900 hover:shadow-sm"
                }`}
              >
                {/* Icon + badges */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-2xl leading-none">{tool.icon}</span>
                  <div className="flex items-center gap-1.5">
                    {tool.isNew && !tool.soon && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300">
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

                {/* Name + desc */}
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
              Try a keyword like &ldquo;merge&rdquo; or &ldquo;compress&rdquo;.
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
      </div>
    </main>
  );
}
