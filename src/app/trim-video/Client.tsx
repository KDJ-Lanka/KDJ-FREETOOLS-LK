"use client";
import ProcessingOverlay from "@/components/ProcessingOverlay";
import { useCallback, useState } from "react";
import { ffTrimVideo, makeBlob, triggerDownload } from "@/lib/ffmpeg-utils";

const INPUT_ID = "trim-video-input";

function toSec(h: number, m: number, s: number) { return h * 3600 + m * 60 + s; }
function fromSec(total: number) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.floor(total % 60);
  return { h, m, s };
}

export default function TrimVideoClient() {
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState(0);
  const [startSec, setStartSec] = useState(0);
  const [endSec, setEndSec] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [dragging, setDragging] = useState(false);

  const load = useCallback((f: File) => {
    if (!f.type.startsWith("video/")) { setError(`"${f.name}" is not a video file.`); return; }
    setFile(f); setError(null); setDone(false);
    const url = URL.createObjectURL(f);
    const v = document.createElement("video");
    v.src = url;
    v.onloadedmetadata = () => {
      const d = Math.floor(v.duration);
      setDuration(d); setStartSec(0); setEndSec(d);
      URL.revokeObjectURL(url);
    };
  }, []);

  const run = async () => {
    if (!file) return;
    if (endSec <= startSec) { setError("End time must be after start time."); return; }
    setError(null); setProcessing(true); setProgress(0);
    try {
      const out = await ffTrimVideo(file, startSec, endSec, setProgress);
      triggerDownload(makeBlob(out, "video/mp4"), file.name.replace(/\.[^.]+$/, "-trimmed.mp4"));
      setDone(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Trim failed."); }
    finally { setProcessing(false); }
  };

  const fmt = (s: number) => { const { h, m, s: sec } = fromSec(s); return `${h ? h + "h " : ""}${m}m ${sec}s`; };

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2"><span className="text-3xl">✂️</span><h1 className="text-2xl sm:text-3xl font-black">Trim Video</h1></div>
        <p className="text-slate-500 dark:text-slate-400">Cut your video — set a start and end point to keep only what you need. Everything runs in your browser.</p>
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
      {done && <div className="mt-4 flex gap-2 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 px-4 py-3 text-sm text-green-700 dark:text-green-400"><span>✅</span><span>Trimmed video downloaded!</span></div>}

      {file && duration > 0 && (
        <div className="mt-6 space-y-5">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <span className="text-xl">🎬</span>
            <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{file.name}</p><p className="text-xs text-slate-400">Duration: {fmt(duration)}</p></div>
            <button type="button" onClick={() => setFile(null)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500">✕</button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { label: "Start time", val: startSec, set: (v: number) => setStartSec(Math.min(v, endSec - 1)) },
              { label: "End time",   val: endSec,   set: (v: number) => setEndSec(Math.max(v, startSec + 1)) },
            ].map(({ label, val, set }) => (
              <div key={label} className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</label>
                <input type="range" min={0} max={duration} value={val} onChange={(e) => set(Number(e.target.value))}
                  className="w-full accent-red-600" />
                <p className="text-sm text-slate-500 text-right">{fmt(val)}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900">
            Keeping: <strong>{fmt(startSec)}</strong> → <strong>{fmt(endSec)}</strong> ({fmt(endSec - startSec)} clip)
          </div>

          {processing && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 bg-slate-50 dark:bg-slate-900">
              <div className="flex justify-between text-xs text-slate-500 mb-1"><span>Trimming…</span><span>{Math.round(progress * 100)}%</span></div>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
            </div>
          )}

          <button type="button" onClick={run} disabled={processing}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-sm transition-colors">
            {processing ? "Trimming…" : "✂️ Trim & Download"}
          </button>
        </div>
      )}
      <ProcessingOverlay active={processing} label="Trimming video…" />
    </main>
  );
}
