"use client";
import ProcessingOverlay from "@/components/ProcessingOverlay";
import { useCallback, useState } from "react";
import { ffVideoCrop, makeBlob, triggerDownload } from "@/lib/ffmpeg-utils";

const INPUT_ID = "video-crop-input";
type Aspect = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
const ASPECTS: { label: string; value: Aspect; desc: string; emoji: string }[] = [
  { label: "1:1",  value: "1:1",  desc: "Square",    emoji: "⬛" },
  { label: "16:9", value: "16:9", desc: "Landscape",  emoji: "🖥️" },
  { label: "9:16", value: "9:16", desc: "Portrait",   emoji: "📱" },
  { label: "4:3",  value: "4:3",  desc: "Classic",    emoji: "📺" },
  { label: "3:4",  value: "3:4",  desc: "Portrait+",  emoji: "🖼️" },
];

export default function VideoCropClient() {
  const [file, setFile] = useState<File | null>(null);
  const [aspect, setAspect] = useState<Aspect>("16:9");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [dragging, setDragging] = useState(false);

  const load = useCallback((f: File) => {
    if (!f.type.startsWith("video/")) { setError(`"${f.name}" is not a video file.`); return; }
    setFile(f); setError(null); setDone(false);
  }, []);

  const run = async () => {
    if (!file) return;
    setError(null); setProcessing(true); setProgress(0);
    try {
      const out = await ffVideoCrop(file, aspect, setProgress);
      triggerDownload(makeBlob(out, "video/mp4"), file.name.replace(/\.[^.]+$/, `_${aspect.replace(":", "x")}_cropped.mp4`));
      setDone(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Processing failed."); }
    finally { setProcessing(false); }
  };

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2"><span className="text-3xl">✂️</span><h1 className="text-2xl sm:text-3xl font-black">Crop Video</h1></div>
        <p className="text-slate-500 dark:text-slate-400">Crop your video to a specific aspect ratio. Center-crop keeps the most important part of the frame.</p>
      </div>

      <label htmlFor={INPUT_ID} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files?.[0]) load(e.dataTransfer.files[0]); }}
        className={`cursor-pointer flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${dragging ? "border-red-400 bg-red-50 dark:bg-red-950/20" : "border-slate-200 dark:border-slate-700 hover:border-red-300 hover:bg-slate-50 dark:hover:bg-slate-900"}`}>
        <input id={INPUT_ID} type="file" accept="video/*" className="sr-only" onChange={(e) => { if (e.target.files?.[0]) load(e.target.files[0]); e.target.value = ""; }} />
        <p className="text-4xl mb-3">🎬</p>
        <p className="font-semibold text-slate-700 dark:text-slate-300">Drop a video here</p>
        <p className="mt-1 text-sm text-slate-400">or click to browse · MP4, MOV, AVI, WebM…</p>
      </label>

      {error && <div className="mt-4 flex gap-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-4 py-3 text-sm text-red-700 dark:text-red-400"><span>⚠️</span><span>{error}</span></div>}
      {done && <div className="mt-4 flex gap-2 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 px-4 py-3 text-sm text-green-700 dark:text-green-400"><span>✅</span><span>Cropped video downloaded!</span></div>}

      {file && (
        <div className="mt-6 space-y-5">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <span className="text-xl">🎬</span>
            <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{file.name}</p><p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(1)} MB</p></div>
            <button type="button" onClick={() => setFile(null)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500">✕</button>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Aspect Ratio</label>
            <div className="grid grid-cols-5 gap-2">
              {ASPECTS.map((a) => (
                <button key={a.value} type="button" onClick={() => setAspect(a.value)}
                  className={`flex flex-col items-center py-3 px-2 rounded-xl border transition-colors ${aspect === a.value ? "bg-red-600 text-white border-red-600" : "border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-600"}`}>
                  <span className="text-lg mb-1">{a.emoji}</span>
                  <span className="text-xs font-bold">{a.label}</span>
                  <span className={`text-[10px] ${aspect === a.value ? "text-red-200" : "text-slate-400"}`}>{a.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {processing && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 bg-slate-50 dark:bg-slate-900">
              <div className="flex justify-between text-xs text-slate-500 mb-1"><span>Cropping…</span><span>{Math.round(progress * 100)}%</span></div>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div className="h-full bg-red-500 rounded-full transition-all duration-300" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
            </div>
          )}

          <button type="button" onClick={run} disabled={processing}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-sm transition-colors">
            {processing ? "Cropping…" : `✂️ Crop to ${aspect} & Download`}
          </button>
        </div>
      )}
      <ProcessingOverlay active={processing} label="Cropping video…" />
    </main>
  );
}
