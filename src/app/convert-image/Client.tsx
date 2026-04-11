"use client";

import ProcessingOverlay from "@/components/ProcessingOverlay";

import { useCallback, useState } from "react";
import { imConvert } from "@/lib/imagemagick-utils";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const INPUT_ID = "convert-image-file-input";
type ImgFormat = "jpg" | "png" | "webp" | "bmp" | "gif" | "tiff";
const FORMATS: { value: ImgFormat; label: string; mime: string }[] = [
  { value: "jpg",  label: "JPG",  mime: "image/jpeg" },
  { value: "png",  label: "PNG",  mime: "image/png"  },
  { value: "webp", label: "WebP", mime: "image/webp" },
  { value: "bmp",  label: "BMP",  mime: "image/bmp"  },
  { value: "gif",  label: "GIF",  mime: "image/gif"  },
  { value: "tiff", label: "TIFF", mime: "image/tiff" },
];

export default function ConvertImageClient() {
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sourceFormat, setSourceFormat] = useState("");
  const [targetFormat, setTargetFormat] = useState<ImgFormat>("png");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [dragging, setDragging] = useState(false);

  const loadFile = useCallback((file: File) => {
    setError(null);
    setDone(false);
    if (!file.type.startsWith("image/")) { setError(`"${file.name}" is not an image.`); return; }
    setSourceFormat(file.type.replace("image/", "").toUpperCase());
    const reader = new FileReader();
    reader.onload = (e) => {
      setBytes(new Uint8Array(e.target!.result as ArrayBuffer));
      setFileName(file.name);
      setFileSize(file.size);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
    };
    reader.readAsArrayBuffer(file);
  }, [previewUrl]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) loadFile(e.target.files[0]);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.[0]) loadFile(e.dataTransfer.files[0]);
  };

  const run = async () => {
    if (!bytes) return;
    setError(null);
    setProcessing(true);
    try {
      const out = await imConvert(bytes, targetFormat);
      const fmtInfo = FORMATS.find(f => f.value === targetFormat)!;
      const blob = new Blob([out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) as ArrayBuffer], { type: fmtInfo.mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName.replace(/\.[^.]+$/, "")}.${targetFormat === "tiff" ? "tiff" : targetFormat}`;
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to convert image.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🔄</span>
          <h1 className="text-2xl sm:text-3xl font-black">Convert Image</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400">
          Convert images between JPG, PNG, WebP, BMP, GIF, and TIFF. Everything runs in your browser.
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
          <span>✅</span><span>Converted successfully! Download started.</span>
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
              <p className="text-xs text-slate-400 dark:text-slate-500">{formatSize(fileSize)}{sourceFormat && ` · ${sourceFormat}`}</p>
            </div>
            <button type="button" onClick={() => { setBytes(null); setDone(false); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-sm">✕</button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Convert to</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {FORMATS.map((f) => (
                <button key={f.value} type="button" onClick={() => setTargetFormat(f.value)}
                  className={`py-2 rounded-lg text-sm font-semibold border transition-colors ${
                    targetFormat === f.value
                      ? "bg-red-600 text-white border-red-600"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-red-300"
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={run}
            disabled={processing}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {processing ? (
              <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Converting…</>
            ) : <>🔄 Convert &amp; Download</>}
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
