"use client";

import ProcessingOverlay from "@/components/ProcessingOverlay";
import { useState } from "react";
import { pdMarkdownToHtml, triggerDocDownload } from "@/lib/pandoc-utils";

const PLACEHOLDER = `# Hello World

Write or paste your **Markdown** here.

- Item one
- Item two

> A blockquote

\`\`\`js
console.log("Hello!");
\`\`\`
`;

export default function Client() {
  const [text, setText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const run = async () => {
    const md = text.trim();
    if (!md) return;
    setError(null);
    setDone(false);
    setProcessing(true);
    try {
      const html = await pdMarkdownToHtml(md);
      triggerDocDownload(html, "output.html", "text/html");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🌐</span>
          <h1 className="text-2xl sm:text-3xl font-black">Markdown to HTML</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400">
          Paste or type Markdown below and download a clean standalone HTML file. Powered by Pandoc — runs entirely in your browser.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Markdown Input</label>
          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setDone(false); }}
            placeholder={PLACEHOLDER}
            rows={16}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            <span className="mt-0.5">⚠️</span><span>{error}</span>
          </div>
        )}
        {done && (
          <div className="flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 px-4 py-3 text-sm text-green-700 dark:text-green-400">
            <span>✅</span><span>HTML file downloaded!</span>
          </div>
        )}

        <button
          type="button"
          onClick={run}
          disabled={processing || !text.trim()}
          className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
        >
          {processing ? (
            <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Converting…</>
          ) : <>🌐 Convert &amp; Download HTML</>}
        </button>
      </div>

      <p className="mt-10 text-center text-xs text-slate-400 dark:text-slate-500">
        🔒 Everything runs in your browser. Nothing is uploaded to any server.
      </p>
      <ProcessingOverlay active={processing} label="Converting with Pandoc…" />
    </main>
  );
}
