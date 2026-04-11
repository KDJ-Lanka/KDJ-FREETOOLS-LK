"use client";

import ProcessingOverlay from "@/components/ProcessingOverlay";

import { useCallback, useState } from "react";
import { PDFDocument, degrees } from "pdf-lib";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const INPUT_ID = "rotate-pdf-file-input";

export default function RotatePdfClient() {
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [mode, setMode] = useState<"all" | "select">("all");
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [rotation, setRotation] = useState(90);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [dragging, setDragging] = useState(false);

  const loadFile = useCallback((file: File) => {
    setError(null);
    setDone(false);
    setSelectedPages(new Set());
    if (file.type !== "application/pdf") { setError(`"${file.name}" is not a PDF.`); return; }
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const b = new Uint8Array(e.target!.result as ArrayBuffer);
        const doc = await PDFDocument.load(b);
        setBytes(b);
        setFileName(file.name);
        setFileSize(file.size);
        setPageCount(doc.getPageCount());
      } catch {
        setError("Failed to load PDF. Make sure it is not encrypted.");
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) loadFile(e.target.files[0]);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.[0]) loadFile(e.dataTransfer.files[0]);
  };

  const togglePage = (n: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n); else next.add(n);
      return next;
    });
  };

  const rotate = async () => {
    if (!bytes) return;
    setError(null);
    setProcessing(true);
    try {
      const doc = await PDFDocument.load(bytes);
      const pages = doc.getPages();
      const toRotate = mode === "all"
        ? pages.map((_, i) => i)
        : Array.from(selectedPages).map((n) => n - 1);

      for (const idx of toRotate) {
        const page = pages[idx];
        const current = page.getRotation().angle;
        page.setRotation(degrees((current + rotation) % 360));
      }

      const outBytes = await doc.save();
      const blob = new Blob([outBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName.replace(/\.pdf$/i, "")}-rotated.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch {
      setError("Failed to rotate PDF.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🔄</span>
          <h1 className="text-2xl sm:text-3xl font-black">Rotate PDF</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400">
          Rotate all or specific pages in a PDF. Everything runs in your browser — your files never leave your device.
        </p>
      </div>

      <label
        htmlFor={INPUT_ID}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`cursor-pointer flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
          dragging ? "border-red-400 bg-red-50 dark:bg-red-950/20" : "border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-800 hover:bg-slate-50 dark:hover:bg-slate-900"
        }`}
      >
        <input id={INPUT_ID} type="file" accept="application/pdf" className="sr-only" onChange={onInputChange} />
        <p className="text-4xl mb-3">📄</p>
        <p className="font-semibold text-slate-700 dark:text-slate-300">Drop a PDF here</p>
        <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">or click to browse</p>
      </label>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <span className="mt-0.5">⚠️</span><span>{error}</span>
        </div>
      )}
      {done && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          <span>✅</span><span>Rotated PDF downloaded successfully!</span>
        </div>
      )}

      {bytes && (
        <div className="mt-6 space-y-5">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <span className="text-xl">📄</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{fileName}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{formatSize(fileSize)} · {pageCount} page{pageCount !== 1 ? "s" : ""}</p>
            </div>
            <button type="button" onClick={() => { setBytes(null); setPageCount(0); setDone(false); }}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-sm">✕</button>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Pages to rotate</p>
            <div className="flex gap-2">
              {(["all", "select"] as const).map((m) => (
                <button key={m} type="button" onClick={() => setMode(m)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === m ? "bg-red-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"}`}>
                  {m === "all" ? "All pages" : "Select pages"}
                </button>
              ))}
            </div>
            {mode === "select" && (
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                  <button key={n} type="button" onClick={() => togglePage(n)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${selectedPages.has(n) ? "bg-red-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"}`}>
                    {n}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Rotation angle</p>
            <div className="flex gap-2">
              {[90, 180, 270].map((deg) => (
                <button key={deg} type="button" onClick={() => setRotation(deg)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${rotation === deg ? "bg-red-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"}`}>
                  {deg}°
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={rotate}
            disabled={processing || (mode === "select" && selectedPages.size === 0)}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {processing ? (
              <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Rotating…</>
            ) : <>🔄 Rotate &amp; Download</>}
          </button>
          {mode === "select" && selectedPages.size === 0 && (
            <p className="text-center text-xs text-slate-400 dark:text-slate-500">Select at least one page to rotate</p>
          )}
        </div>
      )}

      <p className="mt-10 text-center text-xs text-slate-400 dark:text-slate-500">
        🔒 Your files are processed entirely in your browser. Nothing is uploaded to any server.
      </p>
          <ProcessingOverlay active={processing} />
    </main>
  );
}
