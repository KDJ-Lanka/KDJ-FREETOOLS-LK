"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";

type PdfFile = {
  id: string;
  name: string;
  size: number;
  bytes: Uint8Array;
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MergePdf() {
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [merging, setMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const readFile = (file: File): Promise<PdfFile> =>
    new Promise((resolve, reject) => {
      if (file.type !== "application/pdf") {
        reject(new Error(`"${file.name}" is not a PDF file.`));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const bytes = new Uint8Array(e.target!.result as ArrayBuffer);
        resolve({ id: crypto.randomUUID(), name: file.name, size: file.size, bytes });
      };
      reader.onerror = () => reject(new Error(`Failed to read "${file.name}".`));
      reader.readAsArrayBuffer(file);
    });

  const addFiles = useCallback(async (incoming: FileList | File[]) => {
    setError(null);
    try {
      const loaded = await Promise.all(Array.from(incoming).map(readFile));
      setFiles((prev) => {
        const existingNames = new Set(prev.map((f) => f.name));
        const fresh = loaded.filter((f) => !existingNames.has(f.name));
        return [...prev, ...fresh];
      });
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setFiles((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const moveDown = (idx: number) => {
    setFiles((prev) => {
      if (idx === prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  const merge = async () => {
    if (files.length < 2) { setError("Add at least 2 PDF files to merge."); return; }
    setError(null);
    setMerging(true);
    try {
      const merged = await PDFDocument.create();
      for (const f of files) {
        const src = await PDFDocument.load(f.bytes);
        const pages = await merged.copyPages(src, src.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      }
      const outBytes = await merged.save();
      const blob = new Blob([outBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "merged.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to merge. Make sure all files are valid, non-encrypted PDFs.");
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-600 to-rose-500 flex items-center justify-center text-white text-[10px] font-bold shadow">
            FT
          </div>
          <span className="text-sm font-bold hidden sm:block">FreeTools.lk</span>
        </Link>
        <span className="text-slate-300 dark:text-slate-700">/</span>
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Merge PDF</span>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🔗</span>
            <h1 className="text-2xl sm:text-3xl font-black">Merge PDF</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400">
            Combine multiple PDF files into one. Drag to reorder pages before merging. Everything runs in your browser — your files never leave your device.
          </p>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
            dragging
              ? "border-red-400 bg-red-50 dark:bg-red-950/20"
              : "border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-800 hover:bg-slate-50 dark:hover:bg-slate-900"
          }`}
        >
          <input ref={inputRef} type="file" accept="application/pdf" multiple className="hidden" onChange={onInputChange} />
          <p className="text-4xl mb-3">📂</p>
          <p className="font-semibold text-slate-700 dark:text-slate-300">Drop PDF files here</p>
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">or click to browse — you can add more later</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            <span className="mt-0.5">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* File list */}
        {files.length > 0 && (
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {files.length} file{files.length > 1 ? "s" : ""} — drag to reorder
              </p>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
              >
                + Add more
              </button>
            </div>

            {files.map((f, idx) => (
              <div
                key={f.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              >
                {/* Order controls */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0}
                    className="w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 transition-colors"
                    aria-label="Move up"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(idx)}
                    disabled={idx === files.length - 1}
                    className="w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 transition-colors"
                    aria-label="Move down"
                  >
                    ▼
                  </button>
                </div>

                <span className="text-lg shrink-0">📄</span>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{f.name}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{formatSize(f.size)}</p>
                </div>

                <span className="shrink-0 text-xs font-bold text-slate-400 dark:text-slate-600 w-5 text-center">
                  {idx + 1}
                </span>

                <button
                  type="button"
                  onClick={() => removeFile(f.id)}
                  className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  aria-label="Remove"
                >
                  ✕
                </button>
              </div>
            ))}

            {/* Merge button */}
            <div className="pt-4">
              <button
                type="button"
                onClick={merge}
                disabled={merging || files.length < 2}
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {merging ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Merging…
                  </>
                ) : (
                  <>🔗 Merge &amp; Download PDF</>
                )}
              </button>
              {files.length < 2 && (
                <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-2">Add at least 2 PDFs to enable merge</p>
              )}
            </div>
          </div>
        )}

        {/* Privacy note */}
        <p className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500">
          🔒 Your files are processed entirely in your browser. Nothing is uploaded to any server.
        </p>
      </main>
    </div>
  );
}
