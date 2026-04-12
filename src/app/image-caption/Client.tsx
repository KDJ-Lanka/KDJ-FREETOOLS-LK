"use client";
import { useCallback, useState } from "react";

export default function ImageCaptionClient() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) { setError("Please upload an image."); return; }
    setFile(f); setPreviewUrl(URL.createObjectURL(f)); setCaption(null); setError(null);
  }, []);

  const run = async () => {
    if (!file) return;
    setProcessing(true); setError(null); setCaption(null);
    setStatus("⏳ Loading AI model…");
    try {
      const { pipeline } = await import("@huggingface/transformers");
      const captioner = await pipeline("image-to-text", "Xenova/vit-gpt2-image-captioning", { device: "wasm" });
      setStatus("🔍 Analyzing image…");
      const result = await captioner(URL.createObjectURL(file)) as Array<{ generated_text: string }>;
      setCaption(result[0]?.generated_text || "Could not generate caption.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed.");
    } finally {
      setProcessing(false);
    }
  };

  const copy = () => {
    if (caption) { navigator.clipboard.writeText(caption); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2"><span className="text-3xl">💬</span><h1 className="text-2xl sm:text-3xl font-black">AI Image Caption</h1></div>
        <p className="text-slate-500 dark:text-slate-400">Upload any image and AI will describe what&apos;s in it. Great for alt text, accessibility, and content creation.</p>
      </div>

      <label htmlFor="caption-input"
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files?.[0]) load(e.dataTransfer.files[0]); }}
        className={`cursor-pointer flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${file ? "border-green-300 bg-green-50 dark:bg-green-950/20" : dragging ? "border-red-400 bg-red-50" : "border-slate-200 dark:border-slate-700 hover:border-red-300 hover:bg-slate-50 dark:hover:bg-slate-900"}`}>
        <input id="caption-input" type="file" accept="image/*" className="sr-only" onChange={(e) => { if (e.target.files?.[0]) load(e.target.files[0]); e.target.value = ""; }} />
        {previewUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={previewUrl} alt="preview" className="max-h-48 rounded-xl object-contain mb-3" />
          : <p className="text-4xl mb-3">🖼️</p>}
        <p className="font-semibold text-slate-700 dark:text-slate-300">{file ? file.name : "Drop an image here"}</p>
        {!file && <p className="mt-1 text-sm text-slate-400">or click to browse</p>}
      </label>

      {error && <div className="mt-4 flex gap-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 px-4 py-3 text-sm text-red-700 dark:text-red-400"><span>⚠️</span><span>{error}</span></div>}

      {file && (
        <div className="mt-5 space-y-4">
          {caption && (
            <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 px-5 py-4">
              <p className="text-xs text-green-600 dark:text-green-400 font-semibold mb-1">AI Caption</p>
              <p className="text-lg font-medium text-slate-800 dark:text-slate-200 capitalize">{caption}</p>
              <button onClick={copy} className="mt-3 text-xs text-green-600 hover:text-green-700 font-medium">
                {copied ? "✅ Copied!" : "📋 Copy to clipboard"}
              </button>
            </div>
          )}
          {processing && <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 bg-slate-50 dark:bg-slate-900 text-sm animate-pulse">{status}</div>}
          <button onClick={run} disabled={processing}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-sm">
            {processing ? status : "💬 Generate Caption"}
          </button>
        </div>
      )}
      <p className="mt-8 text-center text-xs text-slate-400">🔒 AI runs in your browser. No uploads.</p>
    </main>
  );
}
