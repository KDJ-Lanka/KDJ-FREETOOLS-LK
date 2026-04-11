"use client";

import ProcessingOverlay from "@/components/ProcessingOverlay";

import { useCallback, useState } from "react";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const INPUT_ID = "watermark-pdf-file-input";

type Position = "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

export default function WatermarkPdfClient() {
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [text, setText] = useState("CONFIDENTIAL");
  const [fontSize, setFontSize] = useState(48);
  const [opacity, setOpacity] = useState(30);
  const [position, setPosition] = useState<Position>("center");
  const [color, setColor] = useState("#DC2626");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [dragging, setDragging] = useState(false);

  const loadFile = useCallback((file: File) => {
    setError(null);
    setDone(false);
    if (file.type !== "application/pdf") { setError(`"${file.name}" is not a PDF.`); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      setBytes(new Uint8Array(e.target!.result as ArrayBuffer));
      setFileName(file.name);
      setFileSize(file.size);
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

  const applyWatermark = async () => {
    if (!bytes || !text.trim()) { setError("Enter watermark text."); return; }
    setError(null);
    setProcessing(true);
    try {
      const doc = await PDFDocument.load(bytes);
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      const [r, g, b] = hexToRgb(color);
      const pages = doc.getPages();

      for (const page of pages) {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        const textHeight = font.heightAtSize(fontSize);
        const pad = 20;

        let x: number, y: number, rotateAngle: number;

        if (position === "center") {
          x = width / 2 - textWidth / 2;
          y = height / 2 - textHeight / 2;
          rotateAngle = 45;
        } else {
          rotateAngle = 0;
          if (position === "top-left") { x = pad; y = height - textHeight - pad; }
          else if (position === "top-right") { x = width - textWidth - pad; y = height - textHeight - pad; }
          else if (position === "bottom-left") { x = pad; y = pad; }
          else { x = width - textWidth - pad; y = pad; }
        }

        page.drawText(text, {
          x, y,
          size: fontSize,
          font,
          color: rgb(r, g, b),
          opacity: opacity / 100,
          rotate: degrees(rotateAngle),
        });
      }

      const outBytes = await doc.save();
      const blob = new Blob([outBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName.replace(/\.pdf$/i, "")}-watermarked.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch {
      setError("Failed to apply watermark.");
    } finally {
      setProcessing(false);
    }
  };

  const positions: { value: Position; label: string }[] = [
    { value: "center", label: "Center" },
    { value: "top-left", label: "Top-left" },
    { value: "top-right", label: "Top-right" },
    { value: "bottom-left", label: "Bottom-left" },
    { value: "bottom-right", label: "Bottom-right" },
  ];

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">💧</span>
          <h1 className="text-2xl sm:text-3xl font-black">Watermark PDF</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400">
          Add a text watermark to every page of your PDF. Everything runs in your browser.
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
          <span>✅</span><span>Watermarked PDF downloaded successfully!</span>
        </div>
      )}

      {bytes && (
        <div className="mt-6 space-y-5">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <span className="text-xl">📄</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{fileName}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{formatSize(fileSize)}</p>
            </div>
            <button type="button" onClick={() => { setBytes(null); setDone(false); }}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-sm">✕</button>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Watermark text</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Font size: {fontSize}px</label>
              <input type="range" min={20} max={100} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full accent-red-600" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Opacity: {opacity}%</label>
              <input type="range" min={10} max={100} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-full accent-red-600" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Position</label>
            <div className="flex flex-wrap gap-2">
              {positions.map(({ value, label }) => (
                <button key={value} type="button" onClick={() => setPosition(value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${position === value ? "bg-red-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5 bg-white dark:bg-slate-900" />
              <span className="text-sm text-slate-500 dark:text-slate-400">{color.toUpperCase()}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={applyWatermark}
            disabled={processing}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {processing ? (
              <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Applying watermark…</>
            ) : <>💧 Apply Watermark &amp; Download</>}
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
