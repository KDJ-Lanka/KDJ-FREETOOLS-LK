"use client";
import { useState } from "react";

const LANG_FLAGS: Record<string, string> = {
  en: "🇬🇧", es: "🇪🇸", fr: "🇫🇷", de: "🇩🇪", zh: "🇨🇳", ja: "🇯🇵", ko: "🇰🇷",
  pt: "🇧🇷", it: "🇮🇹", ru: "🇷🇺", ar: "🇸🇦", hi: "🇮🇳", nl: "🇳🇱", sv: "🇸🇪",
  pl: "🇵🇱", tr: "🇹🇷", da: "🇩🇰", fi: "🇫🇮", nb: "🇳🇴", cs: "🇨🇿",
};
const LANG_NAMES: Record<string, string> = {
  en: "English", es: "Spanish", fr: "French", de: "German", zh: "Chinese", ja: "Japanese",
  ko: "Korean", pt: "Portuguese", it: "Italian", ru: "Russian", ar: "Arabic", hi: "Hindi",
  nl: "Dutch", sv: "Swedish", pl: "Polish", tr: "Turkish", da: "Danish", fi: "Finnish",
  nb: "Norwegian", cs: "Czech",
};

export default function LanguageDetectorClient() {
  const [text, setText] = useState("");
  const [results, setResults] = useState<Array<{ label: string; score: number }> | null>(null);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!text.trim()) { setError("Please enter some text."); return; }
    setProcessing(true); setError(null); setResults(null);
    setStatus("⏳ Loading language detection model…");
    try {
      const { pipeline } = await import("@huggingface/transformers");
      const detector = await pipeline("text-classification", "papluca/xlm-roberta-base-language-detection", { device: "wasm" });
      setStatus("🌍 Detecting language…");
      const out = await detector(text, { top_k: 5 }) as Array<{ label: string; score: number }> | Array<Array<{ label: string; score: number }>>;
      setResults(Array.isArray(out[0]) ? (out as Array<Array<{ label: string; score: number }>>)[0] : out as Array<{ label: string; score: number }>);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Detection failed.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2"><span className="text-3xl">🌍</span><h1 className="text-2xl sm:text-3xl font-black">Language Detector</h1></div>
        <p className="text-slate-500 dark:text-slate-400">Instantly identify the language of any text. Supports 20+ languages. AI-powered, runs in your browser.</p>
      </div>

      <div className="space-y-4">
        <textarea value={text} onChange={(e) => { setText(e.target.value); setResults(null); setError(null); }}
          rows={5} placeholder="Paste text in any language…"
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-y" />

        {error && <div className="flex gap-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 px-4 py-3 text-sm text-red-700 dark:text-red-400"><span>⚠️</span><span>{error}</span></div>}

        {results && results.length > 0 && (
          <div className="space-y-3">
            <div className="rounded-xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-5 text-center">
              <p className="text-4xl mb-2">{LANG_FLAGS[results[0].label] || "🌐"}</p>
              <p className="text-2xl font-black">{LANG_NAMES[results[0].label] || results[0].label.toUpperCase()}</p>
              <p className="text-sm text-slate-500 mt-1">{(results[0].score * 100).toFixed(1)}% confidence</p>
            </div>
            {results.slice(1, 4).map(r => (
              <div key={r.label} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-xl">{LANG_FLAGS[r.label] || "🌐"}</span>
                <span className="flex-1 font-medium text-sm">{LANG_NAMES[r.label] || r.label.toUpperCase()}</span>
                <span className="text-xs text-slate-400">{(r.score * 100).toFixed(1)}%</span>
                <div className="w-20 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full bg-red-400 rounded-full" style={{ width: `${r.score * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {processing && <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 bg-slate-50 dark:bg-slate-900 text-sm animate-pulse">{status}</div>}

        <button onClick={run} disabled={processing || !text.trim()}
          className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-sm">
          {processing ? status : "🌍 Detect Language"}
        </button>
      </div>
      <p className="mt-8 text-center text-xs text-slate-400">🔒 AI runs in your browser. No text is sent to any server.</p>
    </main>
  );
}
