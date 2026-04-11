"use client";

import ProcessingOverlay from "@/components/ProcessingOverlay";

import { useCallback, useState } from "react";
import { imResize } from "@/lib/imagemagick-utils";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const INPUT_ID = "resize-image-file-input";

export default function ResizeImageClient() {
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [origW, setOrigW] = useState(0);
  const [origH, setOrigH] = useState(0);
  const [mode, setMode] = useState<"pixels" | "percentage">("pixels");
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [lockAspect, setLockAspect] = useState(true);
  const [percentage, setPercentage] = useState(100);
  const [format, setFormat] = useState("original");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [inputMime, setInputMime] = useState("image/jpeg");

  const loadFile = useCallback((file: File) => {
    setError(null);
    setDone(false);
    if (!file.type.startsWith("image/")) { setError(`"${file.name}" is not an image.`); return; }
    setInputMime(file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      setBytes(new Uint8Array(e.target!.result as ArrayBuffer));
      setFileName(file.name);
      setFileSize(file.size);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      const img = new Image();
      img.onload = () => {
        setOrigW(img.naturalWidth);
        setOrigH(img.naturalHeight);
        setWidth(img.naturalWidth);
        setHeight(img.naturalHeight);
      };
      img.src = url;
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) loadFile(e.target.files[0]);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) loadFile(e.dataTransfer.files[0]);
  };

  const handleWidthChange = (v: number) => {
    setWidth(v);
    if (lockAspect && origW > 0) setHeight(Math.round(origH * v / origW));
  };

  const handleHeightChange = (v: number) => {
    setHeight(v);
    if (lockAspect && origH > 0) setWidth(Math.round(origW * v / origH));
  };

  const getFormat = () => {
    if (format === "original") {
      if (inputMime === "image/png") return "png";
      if (inputMime === "image/webp") return "webp";
      return "jpg";
    }
    return format;
  };

  const run = async () => {
    if (!bytes) return;
    setError(null);
    setProcessing(true);
    try {
      const fmt = getFormat();
      let w = width, h = height;
      if (mode === "percentage") {
        w = Math.round(origW * percentage / 100);
        h = Math.round(origH * percentage / 100);
      }
      const maintainAspect = lockAspect && mode === "pixels";
      const out = await imResize(bytes, w, h, maintainAspect, fmt);
      const extMap: Record<string, string> = { jpg: "jpg", jpeg: "jpg", png: "png", webp: "webp" };
      const ext = extMap[fmt] ?? "jpg";
      const mimeMap: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };
      const mime = mimeMap[fmt] ?? "image/jpeg";
      const blob = new Blob([out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) as ArrayBuffer], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName.replace(/\.[^.]+$/, "")}-resized.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to resize image.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">📐</span>
          <h1 className="text-2xl sm:text-3xl font-black">Resize Image</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400">
          Resize images to exact dimensions or by percentage. Everything runs in your browser.
        </p>
      </div>

      <label
        htmlFor={INPUT_ID}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="cursor-pointer flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-800 hover:bg-slate-50 dark:hover:bg-slate-900"
      >
        <input id={INPUT_ID} type="file" accept="image/*" className="sr-only" onChange={onInputChange} />
        <p className="text-4xl mb-3">🖼️</p>
        <p className="font-semibold text-slate-700 dark:text-slate-300">Drop an image here</p>
        <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">or click to browse</p>
      </label>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <span>⚠️</span><span>{error}</span>
        </div>
      )}
      {done && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          <span>✅</span><span>Resized successfully! Download started.</span>
        </div>
      )}

      {bytes && (
        <div className="mt-6 space-y-4">
          {previewUrl && (
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-64 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Preview" className="max-h-64 max-w-full object-contain" />
            </div>
          )}

          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <span className="text-xl">🖼️</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{fileName}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{formatSize(fileSize)} · {origW}×{origH}px</p>
            </div>
            <button type="button" onClick={() => { setBytes(null); setDone(false); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-sm">✕</button>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
            {(["pixels", "percentage"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm font-semibold transition-colors ${mode === m ? "bg-red-600 text-white" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                {m === "pixels" ? "By Pixels" : "By Percentage"}
              </button>
            ))}
          </div>

          {mode === "pixels" ? (
            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Width (px)</label>
                  <input type="number" min={1} value={width} onChange={(e) => handleWidthChange(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Height (px)</label>
                  <input type="number" min={1} value={height} onChange={(e) => handleHeightChange(Number(e.target.value))}
                    disabled={lockAspect}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm disabled:opacity-50" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={lockAspect} onChange={(e) => setLockAspect(e.target.checked)} className="accent-red-600" />
                Lock aspect ratio
              </label>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-1.5">Scale: {percentage}%</label>
              <input type="range" min={10} max={200} value={percentage} onChange={(e) => setPercentage(Number(e.target.value))}
                className="w-full accent-red-600" />
              <p className="mt-1 text-xs text-slate-400">{Math.round(origW * percentage / 100)}×{Math.round(origH * percentage / 100)}px</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">Output Format</label>
            <select value={format} onChange={(e) => setFormat(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm">
              <option value="original">Same as original</option>
              <option value="jpg">JPG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
            </select>
          </div>

          <button
            type="button"
            onClick={run}
            disabled={processing}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {processing ? (
              <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Resizing…</>
            ) : <>📐 Resize &amp; Download</>}
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
