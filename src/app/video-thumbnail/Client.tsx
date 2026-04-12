"use client";
import ProcessingOverlay from "@/components/ProcessingOverlay";
import { useCallback, useState } from "react";
import { ffVideoThumbnail, makeBlob, triggerDownload } from "@/lib/ffmpeg-utils";

const INPUT_ID = "video-thumbnail-input";

export default function VideoThumbnailClient() {
  const [file, setFile] = useState<File | null>(null);
  const [timeSec, setTimeSec] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const load = useCallback((f: File) => {
    if (!f.type.startsWith("video/")) { setError(`"${f.name}" is not a video file.`); return; }
    setFile(f); setError(null); setPreviewUrl(null);
  }, []);

  const run = async () => {
    if (!file) return;
    setError(null); setProcessing(true);
    try {
      const out = await ffVideoThumbnail(file, timeSec);
      const blob = makeBlob(out, "image/jpeg");
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      triggerDownload(blob, file.name.replace(/\.[^.]+$/, "_thumbnail.jpg"));
    } catch (e) { setError(e instanceof Error ? e.message : "Extraction failed."); }
    finally { setProcessing(false); }
  };

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2"><span className="text-3xl">🖼️</span><h1 className="text-2xl sm:text-3xl font-black">Video Thumbnail</h1></div>
        <p className="text-slate-500 dark:text-slate-400">Extract any frame from a video as a high-quality JPEG image. Set the exact time in seconds. Runs in your browser.</p>
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

      {file && (
        <div className="mt-6 space-y-5">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <span className="text-xl">🎬</span>
            <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{file.name}</p><p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(1)} MB</p></div>
            <button type="button" onClick={() => { setFile(null); setPreviewUrl(null); }} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500">✕</button>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Time (seconds): <span className="text-red-600">{timeSec}s</span></label>
            <input type="range" min={0} max={300} step={1} value={timeSec} onChange={(e) => setTimeSec(Number(e.target.value))} className="w-full accent-red-600" />
            <div className="flex justify-between text-xs text-slate-400"><span>0s</span><span>300s</span></div>
            <input type="number" min={0} max={9999} value={timeSec} onChange={(e) => setTimeSec(Math.max(0, Number(e.target.value)))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" placeholder="Enter exact seconds" />
          </div>

          {previewUrl && (
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
              <img src={previewUrl} alt="Extracted thumbnail" className="w-full object-contain max-h-64" />
              <p className="text-xs text-slate-400 text-center py-2">Extracted at {timeSec}s</p>
            </div>
          )}

          <button type="button" onClick={run} disabled={processing}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-sm transition-colors">
            {processing ? "Extracting…" : "🖼️ Extract Frame & Download"}
          </button>
        </div>
      )}
      <ProcessingOverlay active={processing} label="Extracting frame…" />
    </main>
  );
}
