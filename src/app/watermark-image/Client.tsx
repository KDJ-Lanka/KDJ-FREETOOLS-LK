"use client";

import ProcessingOverlay from "@/components/ProcessingOverlay";

import { useCallback, useEffect, useRef, useState } from "react";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const INPUT_ID = "watermark-image-file-input";
type Position = "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

const POSITIONS: { value: Position; label: string }[] = [
  { value: "top-left",     label: "↖ Top Left"     },
  { value: "top-right",    label: "↗ Top Right"    },
  { value: "center",       label: "⊕ Center"       },
  { value: "bottom-left",  label: "↙ Bottom Left"  },
  { value: "bottom-right", label: "↘ Bottom Right" },
];

export default function WatermarkImageClient() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [text, setText] = useState("FreeTools.lk");
  const [position, setPosition] = useState<Position>("bottom-right");
  const [opacity, setOpacity] = useState(50);
  const [fontSize, setFontSize] = useState(32);
  const [color, setColor] = useState("#ffffff");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [dragging, setDragging] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadFile = useCallback((f: File) => {
    setError(null);
    setDone(false);
    if (!f.type.startsWith("image/")) { setError(`"${f.name}" is not an image.`); return; }
    setFile(f);
    setFileName(f.name);
    setFileSize(f.size);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(f));
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

  // Draw preview on canvas
  useEffect(() => {
    if (!previewUrl || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const img = new Image();
    img.onload = () => {
      const maxW = 600;
      const scale = img.width > maxW ? maxW / img.width : 1;
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const scaledFontSize = fontSize * scale;
      ctx.globalAlpha = opacity / 100;
      ctx.fillStyle = color;
      ctx.font = `bold ${scaledFontSize}px Arial`;
      ctx.textBaseline = "middle";

      const pad = scaledFontSize * 1.5;
      const positions: Record<Position, [number, string, string]> = {
        center:       [canvas.width / 2,           "center",  String(canvas.height / 2)],
        "top-left":   [pad,                         "left",    String(pad)],
        "top-right":  [canvas.width - pad,          "right",   String(pad)],
        "bottom-left":  [pad,                       "left",    String(canvas.height - pad)],
        "bottom-right": [canvas.width - pad,        "right",   String(canvas.height - pad)],
      };
      const [tx, align, ty] = positions[position];
      ctx.textAlign = align as CanvasTextAlign;
      ctx.fillText(text || "Watermark", tx, Number(ty));
      ctx.globalAlpha = 1;
    };
    img.src = previewUrl;
  }, [previewUrl, text, position, opacity, fontSize, color]);

  const run = async () => {
    if (!previewUrl || !file) return;
    setError(null);
    setProcessing(true);
    try {
      const canvas = document.createElement("canvas");
      const img = new Image();
      await new Promise<void>((resolve) => {
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0);

          ctx.globalAlpha = opacity / 100;
          ctx.fillStyle = color;
          ctx.font = `bold ${fontSize}px Arial`;
          ctx.textBaseline = "middle";

          const pad = fontSize * 1.5;
          const positions: Record<Position, [number, CanvasTextAlign, number]> = {
            center:         [img.width / 2,        "center", img.height / 2],
            "top-left":     [pad,                   "left",   pad],
            "top-right":    [img.width - pad,       "right",  pad],
            "bottom-left":  [pad,                   "left",   img.height - pad],
            "bottom-right": [img.width - pad,       "right",  img.height - pad],
          };
          const [tx, align, ty] = positions[position];
          ctx.textAlign = align;
          ctx.fillText(text || "Watermark", tx, ty);
          ctx.globalAlpha = 1;
          resolve();
        };
        img.src = previewUrl!;
      });

      canvas.toBlob((blob) => {
        if (!blob) { setError("Failed to generate image."); setProcessing(false); return; }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName.replace(/\.[^.]+$/, "")}-watermarked.jpg`;
        a.click();
        URL.revokeObjectURL(url);
        setDone(true);
        setProcessing(false);
      }, "image/jpeg", 0.92);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add watermark.");
      setProcessing(false);
    }
  };

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">💧</span>
          <h1 className="text-2xl sm:text-3xl font-black">Watermark Image</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400">
          Add a text watermark to protect your images. Everything runs in your browser.
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
          <span>✅</span><span>Watermarked! Download started.</span>
        </div>
      )}

      {file && (
        <div className="mt-6 space-y-4">
          {previewUrl && (
            <div>
              <p className="text-sm font-medium mb-2">Live Preview</p>
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <canvas ref={canvasRef} className="max-w-full rounded" />
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <span className="text-xl">🖼️</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{fileName}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{formatSize(fileSize)}</p>
            </div>
            <button type="button" onClick={() => { setFile(null); setDone(false); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-sm">✕</button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Watermark Text</label>
            <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="FreeTools.lk"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Position</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {POSITIONS.map((p) => (
                <button key={p.value} type="button" onClick={() => setPosition(p.value)}
                  className={`py-2 px-3 rounded-lg text-sm font-semibold border transition-colors ${
                    position === p.value ? "bg-red-600 text-white border-red-600" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-red-300"
                  }`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Opacity: {opacity}%</label>
              <input type="range" min={10} max={100} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full accent-red-600" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Font Size: {fontSize}px</label>
              <input type="range" min={12} max={128} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full accent-red-600" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Color</label>
            <div className="flex items-center gap-3">
              {["#ffffff", "#000000", "#808080", "#ef4444"].map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? "border-red-600 scale-110" : "border-slate-300 dark:border-slate-600"}`}
                  style={{ backgroundColor: c }} />
              ))}
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-slate-300 dark:border-slate-600" title="Custom color" />
            </div>
          </div>

          <button
            type="button"
            onClick={run}
            disabled={processing}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {processing ? (
              <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Processing…</>
            ) : <>💧 Add Watermark &amp; Download</>}
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
