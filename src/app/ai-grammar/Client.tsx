"use client";
import { useState } from "react";

export default function AiGrammarClient() {
  const [text, setText] = useState("");
  const [corrected, setCorrected] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const run = async () => {
    if (!text.trim()) { setError("Please enter some text."); return; }
    setProcessing(true); setError(null); setCorrected(null);
    setStatus("⏳ Loading AI grammar model…");
    try {
      const { pipeline } = await import("@huggingface/transformers");
      const fixer = await pipeline("text2text-generation", "Xenova/flan-t5-base", { device: "wasm" });
      setStatus("✍️ Fixing grammar…");
      const result = await fixer(`Fix the grammar and spelling: ${text}`, { max_new_tokens: 256 }) as Array<{ generated_text: string }>;
      setCorrected(result[0]?.generated_text || text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Grammar correction failed.");
    } finally {
      setProcessing(false);
    }
  };

  const copy = () => {
    if (corrected) { navigator.clipboard.writeText(corrected); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2"><span className="text-3xl">✍️</span><h1 className="text-2xl sm:text-3xl font-black">AI Grammar Fixer</h1></div>
        <p className="text-slate-500 dark:text-slate-400">Fix grammar, spelling and punctuation mistakes with AI. Paste your text and get instant corrections. Runs in your browser.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Your Text</label>
          <textarea value={text} onChange={(e) => { setText(e.target.value); setCorrected(null); setError(null); }}
            rows={6} placeholder="Paste text with grammar mistakes…"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-y" />
        </div>

        {error && <div className="flex gap-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 px-4 py-3 text-sm text-red-700 dark:text-red-400"><span>⚠️</span><span>{error}</span></div>}

        {corrected && (
          <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 px-5 py-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-semibold text-green-600 dark:text-green-400">✅ Corrected Text</p>
              <button onClick={copy} className="text-xs text-green-600 hover:text-green-700 font-medium">{copied ? "✅ Copied!" : "📋 Copy"}</button>
            </div>
            <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{corrected}</p>
          </div>
        )}

        {processing && <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 bg-slate-50 dark:bg-slate-900 text-sm animate-pulse">{status}</div>}

        <button onClick={run} disabled={processing || !text.trim()}
          className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-sm">
          {processing ? status : "✍️ Fix Grammar"}
        </button>
      </div>
      <p className="mt-8 text-center text-xs text-slate-400">🔒 AI runs in your browser. No text is sent to any server.</p>
    </main>
  );
}
