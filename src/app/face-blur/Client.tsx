"use client";
import { useCallback, useRef, useState } from "react";

export default function FaceBlurClient() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [blurRadius, setBlurRadius] = useState(20);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const load = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) { setError("Please upload an image file."); return; }
    setFile(f); setPreviewUrl(URL.createObjectURL(f)); setResultUrl(null); setError(null);
  }, []);

  const applyPixelate = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, pixelSize: number) => {
    for (let py = y; py < y + h; py += pixelSize) {
      for (let px = x; px < x + w; px += pixelSize) {
        const data = ctx.getImageData(px, py, 1, 1).data;
        ctx.fillStyle = `rgba(${data[0]},${data[1]},${data[2]},${data[3] / 255})`;
        ctx.fillRect(px, py, Math.min(pixelSize, x + w - px), Math.min(pixelSize, y + h - py));
      }
    }
  };

  const run = async () => {
    if (!file) return;
    setProcessing(true); setError(null);
    setStatus("⏳ Loading AI model…");
    try {
      const { pipeline } = await import("@huggingface/transformers");
      setStatus("🔄 Loading object detection model…");
      const detector = await pipeline("object-detection", "Xenova/detr-resnet-50", { device: "wasm" });
      setStatus("🔍 Detecting faces…");
      const imgUrl = URL.createObjectURL(file);
      const results = await detector(imgUrl) as Array<{ label: string; score: number; box: { xmin: number; ymin: number; xmax: number; ymax: number } }>;

      const img = new Image();
      img.src = imgUrl;
      await new Promise<void>(r => { img.onload = () => r(); });

      const canvas = canvasRef.current!;
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      const persons = results.filter(r => r.label === "person" && r.score > 0.7);
      if (persons.length === 0) {
        setError("No people detected in the image. Try a photo with visible people.");
        setProcessing(false);
        return;
      }

      for (const p of persons) {
        const { xmin, ymin, xmax, ymax } = p.box;
        const bw = xmax - xmin;
        const bh = ymax - ymin;
        const faceH = bh * 0.28;
        const faceX = Math.max(0, xmin + bw * 0.1);
        const faceY = Math.max(0, ymin);
        const faceW = bw * 0.8;
        applyPixelate(ctx, Math.round(faceX), Math.round(faceY), Math.round(faceW), Math.round(faceH), blurRadius);
      }

      setResultUrl(canvas.toDataURL("image/png"));
      setStatus(`✅ ${persons.length} face(s) blurred!`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed.");
    } finally {
      setProcessing(false);
    }
  };

  const download = () => {
    if (!resultUrl || !file) return;
    const a = document.createElement("a"); a.href = resultUrl;
    a.download = file.name.replace(/\.[^.]+$/, "_blurred.png"); a.click();
  };

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2"><span className="text-3xl">😶</span><h1 className="text-2xl sm:text-3xl font-black">Face Blur</h1></div>
        <p className="text-slate-500 dark:text-slate-400">Automatically detect and blur faces in photos to protect privacy. AI-powered, runs entirely in your browser.</p>
      </div>

      {!file && (
        <label htmlFor="face-blur-input"
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files?.[0]) load(e.dataTransfer.files[0]); }}
          className={`cursor-pointer flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${dragging ? "border-red-400 bg-red-50" : "border-slate-200 dark:border-slate-700 hover:border-red-300 hover:bg-slate-50 dark:hover:bg-slate-900"}`}>
          <input id="face-blur-input" type="file" accept="image/*" className="sr-only" onChange={(e) => { if (e.target.files?.[0]) load(e.target.files[0]); e.target.value = ""; }} />
          <p className="text-4xl mb-3">😶</p>
          <p className="font-semibold text-slate-700 dark:text-slate-300">Drop a photo with people</p>
          <p className="mt-1 text-sm text-slate-400">or click to browse</p>
        </label>
      )}

      {error && <div className="mt-4 flex gap-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 px-4 py-3 text-sm text-red-700 dark:text-red-400"><span>⚠️</span><span>{error}</span></div>}

      {file && (
        <div className="mt-6 space-y-5">
          <div className="space-y-1">
            <div className="flex justify-between text-sm font-medium text-slate-700 dark:text-slate-300">
              <span>Blur Intensity</span><span className="text-red-600">{blurRadius}px</span>
            </div>
            <input type="range" min={5} max={50} value={blurRadius} onChange={(e) => setBlurRadius(Number(e.target.value))} className="w-full accent-red-600" />
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Original</p>
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-square bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {previewUrl && <img src={previewUrl} alt="original" className="max-w-full max-h-full object-contain" />}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Faces Blurred</p>
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-square bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {resultUrl ? <img src={resultUrl} alt="result" className="max-w-full max-h-full object-contain" />
                  : <span className="text-slate-400 text-sm">{processing ? status : "Result appears here"}</span>}
              </div>
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />

          {processing && <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 bg-slate-50 dark:bg-slate-900 text-sm animate-pulse">{status}</div>}

          <div className="flex gap-3">
            {!resultUrl && <button onClick={run} disabled={processing} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-sm">{processing ? status : "😶 Blur Faces"}</button>}
            {resultUrl && <>
              <button onClick={download} className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm">⬇️ Download</button>
              <button onClick={() => { setFile(null); setPreviewUrl(null); setResultUrl(null); }} className="py-3 px-5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium">Try Another</button>
            </>}
          </div>
        </div>
      )}
      <p className="mt-8 text-center text-xs text-slate-400">🔒 100% private — AI runs in your browser. No uploads.</p>
    </main>
  );
}
