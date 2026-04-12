"use client";

import ProcessingOverlay from "@/components/ProcessingOverlay";
import { useCallback, useState } from "react";
import { pdWordToMarkdown, triggerDocDownload } from "@/lib/pandoc-utils";

export default function Client() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const loadFile = useCallback((f: File) => {
    if (!f.name.toLowerCase().endsWith(".docx")) {
      setError("Please upload a .docx file.");
      return;
    }
    setError(null);
    setDone(false);
    setFile(f);
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.[0]) loadFile(e.dataTransfer.files[0]);
  };

  const run = async () => {
    if (!file) return;
    setError(null);
    setDone(false);
    setProcessing(true);
    try {
      const md = await pdWordToMarkdown(file);
      const outName = file.name.replace(/\.docx$/i, ".md");
      triggerDocDownload(md, outName, "text/markdown");
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
          <span className="text-3xl">🔄</span>
          <h1 className="text-2xl sm:text-3xl font-black">Word to Markdown</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400">
          Upload a .docx Word file and get clean Markdown text. Powered by Pandoc — runs entirely in your browser.
        </p>
      </div>

      <label
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`cursor-pointer flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
          dragging ? "border-red-400 bg-red-50 dark:bg-red-950/20" : "border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-800 hover:bg-slate-50 dark:hover:bg-slate-900"
        }`}
      >
        <input
          type="file"
          accept=".docx"
          className="sr-only"
          onChange={(e) => { if (e.target.files?.[0]) loadFile(e.target.files[0]); e.target.value = ""; }}
        />
        <p className="text-4xl mb-3">📄</p>
        <p className="font-semibold text-slate-700 dark:text-slate-300">Drop a .docx file here</p>
        <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">or click to browse</p>
      </label>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <span className="mt-0.5">⚠️</span><span>{error}</span>
        </div>
      )}
      {done && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          <span>✅</span><span>Markdown file downloaded!</span>
        </div>
      )}

      {file && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <span className="text-xl">📄</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button type="button" onClick={() => { setFile(null); setDone(false); }}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-sm">✕</button>
          </div>

          <button
            type="button"
            onClick={run}
            disabled={processing}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {processing ? (
              <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Converting…</>
            ) : <>🔄 Convert &amp; Download Markdown</>}
          </button>
        </div>
      )}

      <p className="mt-10 text-center text-xs text-slate-400 dark:text-slate-500">
        🔒 Everything runs in your browser. Nothing is uploaded to any server.
      </p>
      <ProcessingOverlay active={processing} label="Converting with Pandoc…" />
    </main>
  );
}
