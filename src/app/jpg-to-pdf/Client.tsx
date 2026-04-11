"use client";

import ProcessingOverlay from "@/components/ProcessingOverlay";

import { useCallback, useState } from "react";
import { PDFDocument } from "pdf-lib";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const INPUT_ID = "jpg-to-pdf-file-input";

type ImgFile = {
  id: string;
  name: string;
  size: number;
  file: File;
  previewUrl: string;
};

export default function JpgToPdfClient() {
  const [images, setImages] = useState<ImgFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [dragging, setDragging] = useState(false);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    setError(null);
    setDone(false);
    const arr = Array.from(incoming).filter((f) => f.type.startsWith("image/"));
    if (arr.length === 0) { setError("Please upload image files."); return; }
    const newItems: ImgFile[] = arr.map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      size: f.size,
      file: f,
      previewUrl: URL.createObjectURL(f),
    }));
    setImages((prev) => {
      const existingNames = new Set(prev.map((x) => x.name));
      return [...prev, ...newItems.filter((x) => !existingNames.has(x.name))];
    });
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addFiles(e.target.files);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const img = prev.find((x) => x.id === id);
      if (img) URL.revokeObjectURL(img.previewUrl);
      return prev.filter((x) => x.id !== id);
    });
  };

  const moveUp = (idx: number) =>
    setImages((prev) => {
      if (idx === 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });

  const moveDown = (idx: number) =>
    setImages((prev) => {
      if (idx === prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });

  const convert = async () => {
    if (images.length === 0) { setError("Add at least one image."); return; }
    setError(null);
    setProcessing(true);
    try {
      const pdfDoc = await PDFDocument.create();

      for (const img of images) {
        const arrayBuf = await new Promise<ArrayBuffer>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target!.result as ArrayBuffer);
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsArrayBuffer(img.file);
        });
        const bytes = new Uint8Array(arrayBuf);

        const imgEl = await new Promise<HTMLImageElement>((resolve) => {
          const el = new Image();
          el.onload = () => resolve(el);
          el.src = img.previewUrl;
        });
        const { naturalWidth: w, naturalHeight: h } = imgEl;

        const type = img.file.type.toLowerCase();
        let embedded;
        if (type.includes("png")) {
          embedded = await pdfDoc.embedPng(bytes);
        } else {
          embedded = await pdfDoc.embedJpg(bytes);
        }

        const page = pdfDoc.addPage([w, h]);
        page.drawImage(embedded, { x: 0, y: 0, width: w, height: h });
      }

      const outBytes = await pdfDoc.save();
      const blob = new Blob([outBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "images.pdf";
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch {
      setError("Failed to convert images to PDF.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">📷</span>
          <h1 className="text-2xl sm:text-3xl font-black">JPG to PDF</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400">
          Convert images (JPG, PNG, WebP) into a single PDF. Reorder before converting. Everything runs in your browser.
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
        <input id={INPUT_ID} type="file" accept="image/*" multiple className="sr-only" onChange={onInputChange} />
        <p className="text-4xl mb-3">🖼️</p>
        <p className="font-semibold text-slate-700 dark:text-slate-300">Drop images here</p>
        <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">or click to browse (JPG, PNG, WebP)</p>
      </label>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <span className="mt-0.5">⚠️</span><span>{error}</span>
        </div>
      )}
      {done && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          <span>✅</span><span>PDF downloaded successfully!</span>
        </div>
      )}

      {images.length > 0 && (
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {images.length} image{images.length !== 1 ? "s" : ""} ready
            </p>
            <label htmlFor={INPUT_ID} className="cursor-pointer text-xs font-semibold text-red-600 dark:text-red-400 hover:underline">+ Add more</label>
          </div>

          {images.map((img, idx) => (
            <div key={img.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex flex-col gap-0.5 shrink-0">
                <button type="button" onClick={() => moveUp(idx)} disabled={idx === 0}
                  className="w-5 h-5 flex items-center justify-center rounded text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 transition-colors">▲</button>
                <button type="button" onClick={() => moveDown(idx)} disabled={idx === images.length - 1}
                  className="w-5 h-5 flex items-center justify-center rounded text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 transition-colors">▼</button>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.previewUrl} alt={img.name} className="w-12 h-12 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{img.name}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{formatSize(img.size)}</p>
              </div>
              <span className="shrink-0 text-xs font-bold text-slate-300 dark:text-slate-700 w-5 text-center">{idx + 1}</span>
              <button type="button" onClick={() => removeImage(img.id)}
                className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-sm">✕</button>
            </div>
          ))}

          <div className="pt-4">
            <button
              type="button"
              onClick={convert}
              disabled={processing}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              {processing ? (
                <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Converting…</>
              ) : <>📷 Convert &amp; Download PDF</>}
            </button>
          </div>
        </div>
      )}

      <p className="mt-10 text-center text-xs text-slate-400 dark:text-slate-500">
        🔒 Your files are processed entirely in your browser. Nothing is uploaded to any server.
      </p>
          <ProcessingOverlay active={processing} />
    </main>
  );
}
