"use client";
import { useCallback, useRef, useState } from "react";

const SIZES: Record<string, { w: number; h: number; label: string }> = {
  us:    { w: 600,  h: 600,  label: 'US 2×2" (600×600px)' },
  eu:    { w: 413,  h: 531,  label: "EU 35×45mm (413×531px)" },
  uk:    { w: 413,  h: 531,  label: "UK 35×45mm (413×531px)" },
  india: { w: 600,  h: 600,  label: "India 51×51mm (600×600px)" },
};
const BG_COLORS = [
  { label: "White", value: "#ffffff" },
  { label: "Blue",  value: "#0047AB" },
  { label: "Gray",  value: "#e8e8e8" },
  { label: "Red",   value: "#B22234" },
];

export default function PassportPhotoClient() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [sizeKey, setSizeKey] = useState("us");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const load = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) { setError("Please upload an image."); return; }
    setFile(f); setPreviewUrl(URL.createObjectURL(f)); setResultUrl(null); setError(null);
  }, []);

  const run = useCallback(() => {
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const { w, h } = SIZES[sizeKey];
      const canvas = canvasRef.current!;
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);
      const scale = Math.max(w / img.width, h / img.height);
      const sw = img.width * scale;
      const sh = img.height * scale;
      const dx = (w - sw) / 2;
      const dy = Math.min(0, (h - sh) * 0.3);
      ctx.drawImage(img, dx, dy, sw, sh);
      setResultUrl(canvas.toDataURL("image/jpeg", 0.95));
    };
    img.src = URL.createObjectURL(file);
  }, [file, bgColor, sizeKey]);

  const download = () => {
    if (!resultUrl || !file) return;
    const a = document.createElement("a"); a.href = resultUrl;
    a.download = file.name.replace(/\.[^.]+$/, "_passport.jpg"); a.click();
  };

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2"><span className="text-3xl">🪪</span><h1 className="text-2xl sm:text-3xl font-black">Passport Photo Maker</h1></div>
        <p className="text-slate-500 dark:text-slate-400">Create passport-size photos instantly. Choose size standard and background color. No upload needed.</p>
      </div>

      {!file && (
        <label htmlFor="passport-input"
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files?.[0]) load(e.dataTransfer.files[0]); }}
          className={`cursor-pointer flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${dragging ? "border-red-400 bg-red-50" : "border-slate-200 dark:border-slate-700 hover:border-red-300 hover:bg-slate-50 dark:hover:bg-slate-900"}`}>
          <input id="passport-input" type="file" accept="image/*" className="sr-only" onChange={(e) => { if (e.target.files?.[0]) load(e.target.files[0]); e.target.value = ""; }} />
          <p className="text-4xl mb-3">🪪</p>
          <p className="font-semibold text-slate-700 dark:text-slate-300">Drop your photo here</p>
          <p className="mt-1 text-sm text-slate-400">or click to browse</p>
        </label>
      )}

      {error && <div className="mt-4 flex gap-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 px-4 py-3 text-sm text-red-700 dark:text-red-400"><span>⚠️</span><span>{error}</span></div>}

      {file && (
        <div className="mt-6 space-y-5">
          <div>
            <p className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Size Standard</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(SIZES).map(([key, s]) => (
                <button key={key} onClick={() => setSizeKey(key)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border transition-colors ${sizeKey === key ? "bg-red-600 text-white border-red-600" : "border-slate-200 dark:border-slate-700 hover:border-red-300"}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Background Color</p>
            <div className="flex gap-3">
              {BG_COLORS.map(c => (
                <button key={c.value} onClick={() => setBgColor(c.value)}
                  className={`w-10 h-10 rounded-xl border-2 transition-all ${bgColor === c.value ? "border-red-600 scale-110" : "border-slate-300 dark:border-slate-600"}`}
                  style={{ backgroundColor: c.value }} title={c.label} />
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Original</p>
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-square bg-slate-100 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {previewUrl && <img src={previewUrl} alt="original" className="max-w-full max-h-full object-contain" />}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Passport Photo</p>
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-square bg-slate-100 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {resultUrl ? <img src={resultUrl} alt="passport" className="max-w-full max-h-full object-contain" />
                  : <span className="text-sm text-slate-400">Click Generate to preview</span>}
              </div>
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />

          <div className="flex gap-3">
            <button onClick={run} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm">🪪 Generate Passport Photo</button>
            {resultUrl && <button onClick={download} className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm">⬇️ Download JPEG</button>}
          </div>
          {resultUrl && <button onClick={() => { setFile(null); setPreviewUrl(null); setResultUrl(null); }} className="w-full py-2 text-sm text-slate-400 hover:text-slate-600">Try another photo</button>}
        </div>
      )}
      <p className="mt-8 text-center text-xs text-slate-400">🔒 Everything runs in your browser. No uploads.</p>
    </main>
  );
}
