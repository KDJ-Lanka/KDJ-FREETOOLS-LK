"use client";

import ProcessingOverlay from "@/components/ProcessingOverlay";

import { useCallback, useEffect, useRef, useState } from "react";
import { imCrop } from "@/lib/imagemagick-utils";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const INPUT_ID = "crop-image-file-input";

export default function CropImageClient() {
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [origW, setOrigW] = useState(0);
  const [origH, setOrigH] = useState(0);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [cropW, setCropW] = useState(0);
  const [cropH, setCropH] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [inputMime, setInputMime] = useState("image/jpeg");
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
        setX(0); setY(0);
        setCropW(img.naturalWidth);
        setCropH(img.naturalHeight);
      };
      img.src = url;
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) loadFile(e.target.files[0]);
    e.target.value = "";
  };

  useEffect(() => {
    if (!previewUrl || !canvasRef.current || cropW <= 0 || cropH <= 0) return;
    const canvas = canvasRef.current;
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(300 / cropW, 200 / cropH, 1);
      canvas.width = Math.round(cropW * scale);
      canvas.height = Math.round(cropH * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, x, y, cropW, cropH, 0, 0, canvas.width, canvas.height);
    };
    img.src = previewUrl;
  }, [previewUrl, x, y, cropW, cropH]);

  const getFormat = () => {
    if (inputMime === "image/png") return "png";
    if (inputMime === "image/webp") return "webp";
    return "jpg";
  };

  const validate = () => {
    if (x < 0 || y < 0) return "X and Y must be ≥ 0.";
    if (cropW <= 0 || cropH <= 0) return "Width and height must be > 0.";
    if (x + cropW > origW) return `X + Width (${x + cropW}) exceeds image width (${origW}).`;
    if (y + cropH > origH) return `Y + Height (${y + cropH}) exceeds image height (${origH}).`;
    return null;
  };

  const run = async () => {
    if (!bytes) return;
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError(null);
    setProcessing(true);
    try {
      const fmt = getFormat();
      const out = await imCrop(bytes, x, y, cropW, cropH, fmt);
      const mimeMap: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };
      const blob = new Blob([out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) as ArrayBuffer], { type: mimeMap[fmt] ?? "image/jpeg" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName.replace(/\.[^.]+$/, "")}-cropped.${fmt}`;
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to crop image.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">✂️</span>
          <h1 className="text-2xl sm:text-3xl font-black">Crop Image</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400">
          Crop images to the exact size you need. Everything runs in your browser.
        </p>
      </div>

      <label
        htmlFor={INPUT_ID}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files?.[0]) loadFile(e.dataTransfer.files[0]); }}
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
          <span>✅</span><span>Cropped successfully! Download started.</span>
        </div>
      )}

      {bytes && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <span className="text-xl">🖼️</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{fileName}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{formatSize(fileSize)} · {origW}×{origH}px</p>
            </div>
            <button type="button" onClick={() => { setBytes(null); setDone(false); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-sm">✕</button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Left / X (px)</label>
              <input type="number" min={0} max={origW - 1} value={x}
                onChange={(e) => { const v = Math.max(0, Math.min(Number(e.target.value), origW - 1)); setX(v); setCropW((w) => Math.min(w, origW - v)); }}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Top / Y (px)</label>
              <input type="number" min={0} max={origH - 1} value={y}
                onChange={(e) => { const v = Math.max(0, Math.min(Number(e.target.value), origH - 1)); setY(v); setCropH((h) => Math.min(h, origH - v)); }}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Width (px)</label>
              <input type="number" min={1} max={origW - x} value={cropW}
                onChange={(e) => setCropW(Math.max(1, Math.min(Number(e.target.value), origW - x)))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Height (px)</label>
              <input type="number" min={1} max={origH - y} value={cropH}
                onChange={(e) => setCropH(Math.max(1, Math.min(Number(e.target.value), origH - y)))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" />
            </div>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 -mt-2">
            Max width: {origW - x}px · Max height: {origH - y}px
          </p>

          {cropW > 0 && cropH > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Crop Preview</p>
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center p-4">
                <canvas ref={canvasRef} className="max-w-full rounded" />
              </div>
              <p className="mt-1 text-xs text-slate-400">{cropW}×{cropH}px</p>
            </div>
          )}

          <button
            type="button"
            onClick={run}
            disabled={processing}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {processing ? (
              <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Cropping…</>
            ) : <>✂️ Crop &amp; Download</>}
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
