"use client";
import { useCallback, useRef, useState } from "react";

export default function ImageUpscalerClient() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [scale, setScale] = useState<2 | 4>(2);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const load = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) { setError("Please upload an image."); return; }
    setFile(f); setPreviewUrl(URL.createObjectURL(f)); setResultUrl(null); setError(null);
  }, []);

  const run = async () => {
    if (!file) return;
    setProcessing(true); setError(null);
    setStatus("⏳ Loading AI upscaler model… (first time ~30s)");
    try {
      const { pipeline } = await import("@huggingface/transformers");
      const upscaler = await pipeline("image-to-image", "Xenova/swin2SR-classical-sr-x2-64", { device: "wasm" });
      setStatus("🔍 Upscaling image…");
      const imageUrl = URL.createObjectURL(file);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let output = await upscaler(imageUrl) as any;

      if (scale === 4) {
        setStatus("🔍 Upscaling 2nd pass (4x)…");
        const tmpCanvas = document.createElement("canvas");
        tmpCanvas.width = output.width; tmpCanvas.height = output.height;
        const tmpCtx = tmpCanvas.getContext("2d")!;
        tmpCtx.putImageData(new ImageData(output.data, output.width, output.height), 0, 0);
        const tmpUrl = tmpCanvas.toDataURL("image/png");
        output = await upscaler(tmpUrl);
      }

      const canvas = canvasRef.current!;
      canvas.width = output.width; canvas.height = output.height;
      const ctx = canvas.getContext("2d")!;
      ctx.putImageData(new ImageData(output.data, output.width, output.height), 0, 0);
      setResultUrl(canvas.toDataURL("image/png"));
      setStatus(`✅ Upscaled to ${output.width}×${output.height}px`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upscaling failed.");
    } finally {
      setProcessing(false);
    }
  };

  const download = () => {
    if (!resultUrl || !file) return;
    const a = document.createElement("a"); a.href = resultUrl;
    a.download = file.name.replace(/\.[^.]+$/, `_${scale}x.png`); a.click();
  };

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2"><span className="text-3xl">🔍</span><h1 className="text-2xl sm:text-3xl font-black">AI Image Upscaler</h1></div>
        <p className="text-slate-500 dark:text-slate-400">Enlarge and enhance images with AI super resolution. Runs entirely in your browser — no uploads.</p>
      </div>

      {!file && (
        <label htmlFor="upscaler-input"
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files?.[0]) load(e.dataTransfer.files[0]); }}
          className={`cursor-pointer flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${dragging ? "border-red-400 bg-red-50" : "border-slate-200 dark:border-slate-700 hover:border-red-300 hover:bg-slate-50 dark:hover:bg-slate-900"}`}>
          <input id="upscaler-input" type="file" accept="image/*" className="sr-only" onChange={(e) => { if (e.target.files?.[0]) load(e.target.files[0]); e.target.value = ""; }} />
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-semibold text-slate-700 dark:text-slate-300">Drop a small image here</p>
          <p className="mt-1 text-sm text-slate-400">Best with images under 512×512px</p>
        </label>
      )}

      {error && <div className="mt-4 flex gap-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 px-4 py-3 text-sm text-red-700 dark:text-red-400"><span>⚠️</span><span>{error}</span></div>}

      {file && (
        <div className="mt-6 space-y-5">
          <div>
            <p className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Upscale Factor</p>
            <div className="flex gap-3">
              {([2, 4] as const).map(s => (
                <button key={s} onClick={() => setScale(s)}
                  className={`flex-1 py-3 rounded-xl font-semibold text-sm border transition-colors ${scale === s ? "bg-red-600 text-white border-red-600" : "border-slate-200 dark:border-slate-700 hover:border-red-300"}`}>
                  {s}× Upscale
                </button>
              ))}
            </div>
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
              <p className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Upscaled {scale}×</p>
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-square bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {resultUrl ? <img src={resultUrl} alt="upscaled" className="max-w-full max-h-full object-contain" />
                  : <span className="text-sm text-slate-400">{processing ? status : "Result here"}</span>}
              </div>
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />

          {processing && <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 bg-slate-50 dark:bg-slate-900 text-sm animate-pulse">{status}</div>}

          <div className="flex gap-3">
            {!resultUrl && <button onClick={run} disabled={processing} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-sm">{processing ? status : `🔍 Upscale ${scale}×`}</button>}
            {resultUrl && <>
              <button onClick={download} className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm">⬇️ Download PNG</button>
              <button onClick={() => { setFile(null); setPreviewUrl(null); setResultUrl(null); }} className="py-3 px-5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm">Try Another</button>
            </>}
          </div>
        </div>
      )}
      <p className="mt-8 text-center text-xs text-slate-400">🔒 AI runs in your browser. No uploads.</p>
    </main>
  );
}
