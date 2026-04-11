"use client";

import ProcessingOverlay from "@/components/ProcessingOverlay";

import { useCallback, useState } from "react";
import { PDFDocument } from "pdf-lib";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const INPUT_ID = "reorder-pdf-file-input";

type PageItem = {
  originalIndex: number;
  thumbnail: string;
};

export default function ReorderPdfClient() {
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [dragging, setDragging] = useState(false);

  const loadFile = useCallback(async (file: File) => {
    setError(null);
    setDone(false);
    setPages([]);
    if (file.type !== "application/pdf") { setError(`"${file.name}" is not a PDF.`); return; }
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).href;
        const raw = new Uint8Array(e.target!.result as ArrayBuffer);
        // Keep a separate copy — pdfjs-dist transfers the buffer to its worker
        const b = raw.slice(0);
        setPdfBytes(raw.slice(0));
        setFileName(file.name);
        setFileSize(file.size);

        const loadingTask = pdfjsLib.getDocument({ data: b });
        const pdf = await loadingTask.promise;

        const items: PageItem[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.3 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d")!;
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          items.push({ originalIndex: i - 1, thumbnail: canvas.toDataURL() });
        }

        setPages(items);
      } catch {
        setError("Failed to load PDF.");
      } finally {
        setLoading(false);
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

  const moveUp = (idx: number) =>
    setPages((prev) => {
      if (idx === 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });

  const moveDown = (idx: number) =>
    setPages((prev) => {
      if (idx === prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });

  const resetOrder = () =>
    setPages((prev) => [...prev].sort((a, b) => a.originalIndex - b.originalIndex));

  const rebuild = async () => {
    if (!pdfBytes) return;
    setError(null);
    setProcessing(true);
    try {
      const src = await PDFDocument.load(pdfBytes);
      const doc = await PDFDocument.create();
      const indices = pages.map((p) => p.originalIndex);
      const copied = await doc.copyPages(src, indices);
      copied.forEach((p) => doc.addPage(p));
      const outBytes = await doc.save();
      const blob = new Blob([outBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName.replace(/\.pdf$/i, "")}-reordered.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch {
      setError("Failed to reorder PDF.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🔀</span>
          <h1 className="text-2xl sm:text-3xl font-black">Reorder PDF Pages</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400">
          Rearrange the pages of a PDF in any order. Everything runs in your browser — your files never leave your device.
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

      {loading && (
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <svg className="animate-spin w-4 h-4 text-red-600" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
          Loading PDF thumbnails…
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <span className="mt-0.5">⚠️</span><span>{error}</span>
        </div>
      )}
      {done && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          <span>✅</span><span>Reordered PDF downloaded successfully!</span>
        </div>
      )}

      {pages.length > 0 && (
        <div className="mt-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium truncate">{fileName}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{formatSize(fileSize)} · {pages.length} pages</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={resetOrder}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium">
                Reset order
              </button>
              <button type="button" onClick={() => { setPdfBytes(null); setPages([]); setDone(false); }}
                className="text-xs px-3 py-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors font-medium">
                Remove
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {pages.map((p, idx) => (
              <div key={`${p.originalIndex}-${idx}`} className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.thumbnail} alt={`Page ${idx + 1}`} className="w-full rounded border border-slate-100 dark:border-slate-700" />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{idx + 1}</span>
                <div className="flex gap-1">
                  <button type="button" onClick={() => moveUp(idx)} disabled={idx === 0}
                    className="w-6 h-6 flex items-center justify-center rounded text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 transition-colors bg-slate-50 dark:bg-slate-800">▲</button>
                  <button type="button" onClick={() => moveDown(idx)} disabled={idx === pages.length - 1}
                    className="w-6 h-6 flex items-center justify-center rounded text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 transition-colors bg-slate-50 dark:bg-slate-800">▼</button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={rebuild}
            disabled={processing}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {processing ? (
              <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Building PDF…</>
            ) : <>🔀 Save Reordered PDF</>}
          </button>
        </div>
      )}

      <p className="mt-10 text-center text-xs text-slate-400 dark:text-slate-500">
        🔒 Your files are processed entirely in your browser. Nothing is uploaded to any server.
      </p>
          <ProcessingOverlay active={processing} />
    </main>
  );
}
