"use client";
import { useCallback, useRef, useState } from "react";

const COLORS = ["#ef4444","#3b82f6","#22c55e","#f59e0b","#8b5cf6","#ec4899","#14b8a6","#f97316","#6366f1","#84cc16"];

type DetectedObject = { label: string; score: number; box: { xmin: number; ymin: number; xmax: number; ymax: number } };

export default function ObjectDetectorClient() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [objects, setObjects] = useState<DetectedObject[] | null>(null);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const load = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) { setError("Please upload an image."); return; }
    setFile(f); setPreviewUrl(URL.createObjectURL(f)); setObjects(null); setError(null);
  }, []);

  const drawBoxes = useCallback((detected: DetectedObject[], img: HTMLImageElement) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    detected.forEach((obj, i) => {
      const color = COLORS[i % COLORS.length];
      const { xmin, ymin, xmax, ymax } = obj.box;
      ctx.strokeStyle = color; ctx.lineWidth = 3;
      ctx.strokeRect(xmin, ymin, xmax - xmin, ymax - ymin);
      const label = `${obj.label} ${(obj.score * 100).toFixed(0)}%`;
      ctx.fillStyle = color;
      ctx.fillRect(xmin, ymin - 22, ctx.measureText(label).width + 10, 22);
      ctx.fillStyle = "#fff"; ctx.font = "bold 14px sans-serif";
      ctx.fillText(label, xmin + 5, ymin - 6);
    });
  }, []);

  const run = async () => {
    if (!file) return;
    setProcessing(true); setError(null); setObjects(null);
    setStatus("⏳ Loading AI model…");
    try {
      const { pipeline } = await import("@huggingface/transformers");
      const detector = await pipeline("object-detection", "Xenova/detr-resnet-50", { device: "wasm" });
      setStatus("🎯 Detecting objects…");
      const imgUrl = URL.createObjectURL(file);
      const results = await detector(imgUrl, { threshold: 0.5 }) as DetectedObject[];
      setObjects(results);

      const img = new Image(); img.src = imgUrl;
      await new Promise<void>(r => { img.onload = () => r(); });
      drawBoxes(results, img);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Detection failed.");
    } finally {
      setProcessing(false);
    }
  };

  const download = () => {
    if (!canvasRef.current || !file) return;
    const a = document.createElement("a"); a.href = canvasRef.current.toDataURL("image/png");
    a.download = file.name.replace(/\.[^.]+$/, "_detected.png"); a.click();
  };

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2"><span className="text-3xl">🎯</span><h1 className="text-2xl sm:text-3xl font-black">AI Object Detector</h1></div>
        <p className="text-slate-500 dark:text-slate-400">Upload any photo and AI will detect and label all objects with colored bounding boxes. Runs in your browser.</p>
      </div>

      {!file && (
        <label htmlFor="obj-input"
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files?.[0]) load(e.dataTransfer.files[0]); }}
          className={`cursor-pointer flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${dragging ? "border-red-400 bg-red-50" : "border-slate-200 dark:border-slate-700 hover:border-red-300 hover:bg-slate-50 dark:hover:bg-slate-900"}`}>
          <input id="obj-input" type="file" accept="image/*" className="sr-only" onChange={(e) => { if (e.target.files?.[0]) load(e.target.files[0]); e.target.value = ""; }} />
          <p className="text-4xl mb-3">🎯</p>
          <p className="font-semibold text-slate-700 dark:text-slate-300">Drop any photo</p>
          <p className="mt-1 text-sm text-slate-400">or click to browse</p>
        </label>
      )}

      {error && <div className="mt-4 flex gap-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 px-4 py-3 text-sm text-red-700 dark:text-red-400"><span>⚠️</span><span>{error}</span></div>}

      {file && (
        <div className="mt-6 space-y-5">
          <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
            {objects
              ? <canvas ref={canvasRef} className="w-full" />
              : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {previewUrl && <img ref={imgRef} src={previewUrl} alt="original" className="w-full object-contain max-h-96" />}
                  <canvas ref={canvasRef} className="hidden" />
                </>
              )
            }
          </div>

          {objects && objects.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {objects.map((obj, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-sm font-medium capitalize truncate">{obj.label}</span>
                  <span className="text-xs text-slate-400 ml-auto">{(obj.score * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}

          {processing && <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 bg-slate-50 dark:bg-slate-900 text-sm animate-pulse">{status}</div>}

          <div className="flex gap-3">
            {!objects && <button onClick={run} disabled={processing} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-sm">{processing ? status : "🎯 Detect Objects"}</button>}
            {objects && <>
              <button onClick={download} className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm">⬇️ Download Annotated Image</button>
              <button onClick={() => { setFile(null); setObjects(null); setPreviewUrl(null); }} className="py-3 px-5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm">Try Another</button>
            </>}
          </div>
        </div>
      )}
      <p className="mt-8 text-center text-xs text-slate-400">🔒 AI runs in your browser. No uploads.</p>
    </main>
  );
}
