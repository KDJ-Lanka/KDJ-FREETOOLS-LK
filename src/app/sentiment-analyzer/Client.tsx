"use client";
import { useState } from "react";

type Sentiment = { label: string; score: number };

export default function SentimentAnalyzerClient() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<Sentiment | null>(null);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!text.trim()) { setError("Please enter some text."); return; }
    setProcessing(true); setError(null); setResult(null);
    setStatus("⏳ Loading AI model…");
    try {
      const { pipeline } = await import("@huggingface/transformers");
      const classifier = await pipeline("text-classification", "Xenova/distilbert-base-uncased-finetuned-sst-2-english", { device: "wasm" });
      setStatus("🔍 Analyzing sentiment…");
      const out = await classifier(text) as Sentiment[];
      setResult(out[0]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed.");
    } finally {
      setProcessing(false);
    }
  };

  const getEmoji = (label: string) => label === "POSITIVE" ? "😊" : label === "NEGATIVE" ? "😞" : "😐";
  const getColor = (label: string) => label === "POSITIVE" ? "text-green-600" : label === "NEGATIVE" ? "text-red-600" : "text-yellow-600";
  const getBarColor = (label: string) => label === "POSITIVE" ? "bg-green-500" : label === "NEGATIVE" ? "bg-red-500" : "bg-yellow-500";

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2"><span className="text-3xl">😊</span><h1 className="text-2xl sm:text-3xl font-black">Sentiment Analyzer</h1></div>
        <p className="text-slate-500 dark:text-slate-400">Detect the emotional tone of any text — positive, negative or neutral. Powered by AI, runs in your browser.</p>
      </div>

      <div className="space-y-4">
        <textarea value={text} onChange={(e) => { setText(e.target.value); setResult(null); setError(null); }}
          rows={5} placeholder="Type or paste text to analyze…"
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-y" />

        {error && <div className="flex gap-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 px-4 py-3 text-sm text-red-700 dark:text-red-400"><span>⚠️</span><span>{error}</span></div>}

        {result && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center space-y-4">
            <p className="text-6xl">{getEmoji(result.label)}</p>
            <p className={`text-2xl font-black ${getColor(result.label)}`}>{result.label}</p>
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Confidence</span><span>{(result.score * 100).toFixed(1)}%</span>
              </div>
              <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${getBarColor(result.label)}`} style={{ width: `${result.score * 100}%` }} />
              </div>
            </div>
          </div>
        )}

        {processing && <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 bg-slate-50 dark:bg-slate-900 text-sm animate-pulse">{status}</div>}

        <button onClick={run} disabled={processing || !text.trim()}
          className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-sm">
          {processing ? status : "😊 Analyze Sentiment"}
        </button>
      </div>
      <p className="mt-8 text-center text-xs text-slate-400">🔒 AI runs in your browser. No text is sent to any server.</p>
    </main>
  );
}
