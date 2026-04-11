"use client";
import ProcessingOverlay from "@/components/ProcessingOverlay";
import { useCallback, useState } from "react";
import { ffVideoToGif, makeBlob, triggerDownload } from "@/lib/ffmpeg-utils";

const INPUT_ID = "video-to-gif-input";

export default function VideoToGif() {
  const [file, setFile] = useState<File | null>(null);
  const [start, setStart] = useState(0);
  const [duration, setDuration] = useState(5);
  const [fps, setFps] = useState(10);
  const [width, setWidth] = useState(480);
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
      const out = await ffVideoToGif(file, start, duration, fps, width, setProgress);
      triggerDownload(makeBlob(out, "image/gif"), file.name.replace(/\.[^.]+$/, ".gif"));
      setDone(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Conversion failed."); }
    finally { setProcessing(false); }
  };

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2"><span className="text-3xl">🎞️</span><h1 className="text-2xl sm:text-3xl font-black">Video to GIF</h1></div>
        <p className="text-slate-500 dark:text-slate-400">Convert a video clip into an animated GIF. Control start time, duration, FPS and width. Runs in your browser.</p>
      </div>

      <label htmlFor={INPUT_ID} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files?.[0]) load(e.dataTransfer.files[0]); }}
        className={`cursor-pointer flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${dragging ? "border-red-400 bg-red-50" : "border-slate-200 dark:border-slate-700 hover:border-red-300 hover:bg-slate-50 dark:hover:bg-slate-900"}`}>
        <input id={INPUT_ID} type="file" accept="video/*" className="sr-only" onChange={(e) => { if (e.target.files?.[0]) load(e.target.files[0]); e.target.value = ""; }} />
        <p className="text-4xl mb-3">🎬</p>
        <p className="font-semibold text-slate-700 dark:text-slate-300">Drop a video here</p>
        <p className="mt-1 text-sm text-slate-400">or click to browse</p>
      </label>

      {error && <div className="mt-4 flex gap-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 px-4 py-3 text-sm text-red-700 dark:text-red-400"><span>⚠️</span><span>{error}</span></div>}
      {done && <div className="mt-4 flex gap-2 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 px-4 py-3 text-sm text-green-700 dark:text-green-400"><span>✅</span><span>GIF created and downloaded!</span></div>}

      {file && (
        <div className="mt-6 space-y-5">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <span className="text-xl">🎬</span>
            <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{file.name}</p><p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(1)} MB</p></div>
            <button type="button" onClick={() => setFile(null)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500">✕</button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { label: "Start (seconds)", min: 0, max: 300, val: start, set: setStart },
              { label: "Duration (seconds)", min: 1, max: 30, val: duration, set: setDuration },
              { label: "FPS", min: 5, max: 30, val: fps, set: setFps },
              { label: "Width (px)", min: 120, max: 800, val: width, set: setWidth },
            ].map(({ label, min, max, val, set }) => (
              <div key={label} className="space-y-1">
                <div className="flex justify-between text-sm font-medium text-slate-700 dark:text-slate-300"><span>{label}</span><span className="text-red-600">{val}</span></div>
                <input type="range" min={min} max={max} value={val} onChange={(e) => set(Number(e.target.value))} className="w-full accent-red-600" />
              </div>
            ))}
          </div>

          {processing && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 bg-slate-50 dark:bg-slate-900">
              <div className="flex justify-between text-xs text-slate-500 mb-1"><span>Creating GIF…</span><span>{Math.round(progress * 100)}%</span></div>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
            </div>
          )}

          <button type="button" onClick={run} disabled={processing}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-sm transition-colors">
            {processing ? "Creating GIF…" : "🎞️ Create GIF & Download"}
          </button>
        </div>
      )}
      <ProcessingOverlay active={processing} label="Creating GIF…" />
    </main>
  );
}
