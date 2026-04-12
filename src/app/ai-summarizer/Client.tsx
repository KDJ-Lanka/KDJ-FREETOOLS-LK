"use client";
import { useState } from "react";

export default function AiSummarizerClient() {
  const [text, setText] = useState("");
  const [summary, setSummary] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const wordCount = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

  const run = async () => {
    if (!text.trim() || text.trim().split(/\s+/).length < 30) {
      setError("Please enter at least 30 words to summarize."); return;
    }
    setProcessing(true); setError(null); setSummary(null);
    setStatus("⏳ Loading AI summarizer…");
    try {
      const { pipeline } = await import("@huggingface/transformers");
      const summarizer = await pipeline("summarization", "Xenova/distilbart-cnn-12-6", { device: "wasm" });
      setStatus("📋 Summarizing…");
      const result = await summarizer(text, { max_new_tokens: 100, min_new_tokens: 20 }) as Array<{ summary_text: string }>;
      setSummary(result[0]?.summary_text || "Could not generate summary.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Summarization failed.");
    } finally {
      setProcessing(false);
    }
  };

  const copy = () => {
    if (summary) { navigator.clipboard.writeText(summary); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2"><span className="text-3xl">📋</span><h1 className="text-2xl sm:text-3xl font-black">AI Text Summarizer</h1></div>
        <p className="text-slate-500 dark:text-slate-400">Paste any article, document or long text and get a concise summary in seconds. Runs in your browser.</p>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Your Text</label>
            <span className="text-xs text-slate-400">{wordCount(text)} words</span>
          </div>
          <textarea value={text} onChange={(e) => { setText(e.target.value); setSummary(null); setError(null); }}
            rows={8} placeholder="Paste your text here (articles, reports, documents…)"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-y" />
        </div>

        {error && <div className="flex gap-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 px-4 py-3 text-sm text-red-700 dark:text-red-400"><span>⚠️</span><span>{error}</span></div>}

        {summary && (
          <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 px-5 py-4">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">AI Summary · {wordCount(summary)} words (was {wordCount(text)})</p>
              <button onClick={copy} className="text-xs text-blue-600 hover:text-blue-700 font-medium">{copied ? "✅ Copied!" : "📋 Copy"}</button>
            </div>
            <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">{summary}</p>
          </div>
        )}

        {processing && <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 bg-slate-50 dark:bg-slate-900 text-sm animate-pulse">{status}</div>}

        <button onClick={run} disabled={processing || !text.trim()}
          className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-sm">
          {processing ? status : "📋 Summarize Text"}
        </button>
      </div>
      <p className="mt-8 text-center text-xs text-slate-400">🔒 AI runs in your browser. No text is sent to any server.</p>
    </main>
  );
}
