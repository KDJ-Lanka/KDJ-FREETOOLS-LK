"use client";
import { useCallback, useRef, useState } from "react";

const INPUT_ID = "bg-remover-input";

export default function BackgroundRemoverClient() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const load = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) { setError("Please upload an image file."); return; }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setResultUrl(null);
    setError(null);
  }, []);

  const run = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setStatus("⏳ Loading AI model… (first time may take 30–60s)");
    try {
      const { AutoModel, AutoProcessor, RawImage, env } = await import("@huggingface/transformers");
      env.allowLocalModels = false;
      env.useBrowserCache = true;

      setStatus("🔄 Loading RMBG model…");
      const model = await AutoModel.from_pretrained("briaai/RMBG-1.4", {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        config: { model_type: "custom" } as any,
      });
      const processor = await AutoProcessor.from_pretrained("briaai/RMBG-1.4", {
        config: {
          do_normalize: true,
          do_pad: false,
          do_rescale: true,
          do_resize: true,
          image_mean: [0.5, 0.5, 0.5],
          image_std: [1, 1, 1],
          resample: 2,
          rescale_factor: 0.00392156862745098,
          size: { width: 1024, height: 1024 },
        },
      });

      setStatus("🖼️ Removing background…");
      const img = await RawImage.fromURL(URL.createObjectURL(file));
      const { pixel_values } = await processor(img);
      const { output } = await model({ input: pixel_values });

      const mask = await RawImage.fromTensor(output[0].mul(255).to("uint8")).resize(img.width, img.height);
      const canvas = canvasRef.current!;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      const blob = await (await fetch(URL.createObjectURL(file))).blob();
      ctx.drawImage(await createImageBitmap(blob), 0, 0);
      const imgData = ctx.getImageData(0, 0, img.width, img.height);
      for (let i = 0; i < mask.data.length; i++) {
        imgData.data[i * 4 + 3] = (mask.data as unknown as number[])[i];
      }
      ctx.putImageData(imgData, 0, 0);
      setResultUrl(canvas.toDataURL("image/png"));
      setStatus("✅ Done!");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove background.");
    } finally {
      setProcessing(false);
    }
  };

  const download = () => {
    if (!resultUrl || !file) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = file.name.replace(/\.[^.]+$/, "_no_bg.png");
    a.click();
  };

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2"><span className="text-3xl">✂️</span><h1 className="text-2xl sm:text-3xl font-black">AI Background Remover</h1></div>
        <p className="text-slate-500 dark:text-slate-400">Remove backgrounds instantly with AI. Runs entirely in your browser — your photos never leave your device.</p>
      </div>

      {!file && (
        <label htmlFor={INPUT_ID}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files?.[0]) load(e.dataTransfer.files[0]); }}
          className={`cursor-pointer flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${dragging ? "border-red-400 bg-red-50" : "border-slate-200 dark:border-slate-700 hover:border-red-300 hover:bg-slate-50 dark:hover:bg-slate-900"}`}>
          <input id={INPUT_ID} type="file" accept="image/*" className="sr-only" onChange={(e) => { if (e.target.files?.[0]) load(e.target.files[0]); e.target.value = ""; }} />
          <p className="text-4xl mb-3">🖼️</p>
          <p className="font-semibold text-slate-700 dark:text-slate-300">Drop an image here</p>
          <p className="mt-1 text-sm text-slate-400">or click to browse · PNG, JPG, WebP</p>
        </label>
      )}

      {error && <div className="mt-4 flex gap-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 px-4 py-3 text-sm text-red-700 dark:text-red-400"><span>⚠️</span><span>{error}</span></div>}

      {file && (
        <div className="mt-6 space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Original</p>
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-square flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {previewUrl && <img src={previewUrl} alt="original" className="max-w-full max-h-full object-contain" />}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Background Removed</p>
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjY2NjIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNjY2MiLz48L3N2Zz4=')] aspect-square flex items-center justify-center">
                {resultUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={resultUrl} alt="result" className="max-w-full max-h-full object-contain" />
                  : <span className="text-slate-400 text-sm">{processing ? status : "Result appears here"}</span>
                }
              </div>
            </div>
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {processing && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 bg-slate-50 dark:bg-slate-900 text-sm text-slate-600 dark:text-slate-400 animate-pulse">
              {status}
            </div>
          )}

          <div className="flex gap-3">
            {!resultUrl && (
              <button onClick={run} disabled={processing}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-sm transition-colors">
                {processing ? status : "✂️ Remove Background"}
              </button>
            )}
            {resultUrl && (
              <>
                <button onClick={download}
                  className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition-colors">
                  ⬇️ Download PNG
                </button>
                <button onClick={() => { setFile(null); setPreviewUrl(null); setResultUrl(null); }}
                  className="py-3 px-5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800">
                  Try Another
                </button>
              </>
            )}
          </div>
        </div>
      )}
      <p className="mt-8 text-center text-xs text-slate-400">🔒 100% private — everything runs in your browser. No uploads.</p>
    </main>
  );
}
