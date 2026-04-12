"use client";
import ProcessingOverlay from "@/components/ProcessingOverlay";
import { useCallback, useEffect, useRef, useState } from "react";
import { ffVideoToGif, makeBlob, triggerDownload } from "@/lib/ffmpeg-utils";

const INPUT_ID = "video-to-gif-input";
const PREVIEW_DEBOUNCE_MS = 800;

export default function VideoToGifClient() {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);

  const [start, setStart] = useState(0);
  const [duration, setDuration] = useState(5);
  const [fps, setFps] = useState(10);
  const [width, setWidth] = useState(480);

  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [dragging, setDragging] = useState(false);

  // GIF preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const previewDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPreviewUrl = useRef<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Create object URL for video element
  useEffect(() => {
    if (!file) { setVideoUrl(null); return; }
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Seek video preview to current start when start changes
  useEffect(() => {
    if (videoRef.current) videoRef.current.currentTime = start;
  }, [start]);

  // Revoke previous GIF preview URLs to avoid memory leaks
  const updatePreviewUrl = useCallback((url: string | null) => {
    if (prevPreviewUrl.current) URL.revokeObjectURL(prevPreviewUrl.current);
    prevPreviewUrl.current = url;
    setPreviewUrl(url);
  }, []);

  // Debounced GIF preview generation
  const schedulePreview = useCallback(() => {
    if (previewDebounce.current) clearTimeout(previewDebounce.current);
    previewDebounce.current = setTimeout(async () => {
      if (!file) return;
      setPreviewBusy(true);
      try {
        // Use low FPS + small width for fast preview
        const previewFps = Math.min(fps, 10);
        const previewWidth = Math.min(width, 320);
        const previewDuration = Math.min(duration, 4);
        const out = await ffVideoToGif(file, start, previewDuration, previewFps, previewWidth);
        updatePreviewUrl(URL.createObjectURL(makeBlob(out, "image/gif")));
      } catch {
        // silently ignore preview errors
      } finally {
        setPreviewBusy(false);
      }
    }, PREVIEW_DEBOUNCE_MS);
  }, [file, start, duration, fps, width, updatePreviewUrl]);

  // Trigger preview whenever settings change
  useEffect(() => {
    if (file) schedulePreview();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, start, duration, fps, width]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previewDebounce.current) clearTimeout(previewDebounce.current);
      if (prevPreviewUrl.current) URL.revokeObjectURL(prevPreviewUrl.current);
    };
  }, []);

  const load = useCallback((f: File) => {
    if (!f.type.startsWith("video/")) { setError(`"${f.name}" is not a video file.`); return; }
    setFile(f); setError(null); setDone(false); updatePreviewUrl(null);
  }, [updatePreviewUrl]);

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

  // Clamp start so it doesn't exceed video length
  const maxStart = Math.max(0, videoDuration - 1);

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2"><span className="text-3xl">🎞️</span><h1 className="text-2xl sm:text-3xl font-black">Video to GIF</h1></div>
        <p className="text-slate-500 dark:text-slate-400">Convert a video clip into an animated GIF. Live preview updates as you adjust settings. Runs entirely in your browser via FFmpeg WASM.</p>
      </div>

      {/* Drop zone — only shown when no file loaded */}
      {!file && (
        <label htmlFor={INPUT_ID}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files?.[0]) load(e.dataTransfer.files[0]); }}
          className={`cursor-pointer flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${dragging ? "border-red-400 bg-red-50" : "border-slate-200 dark:border-slate-700 hover:border-red-300 hover:bg-slate-50 dark:hover:bg-slate-900"}`}>
          <input id={INPUT_ID} type="file" accept="video/*" className="sr-only" onChange={(e) => { if (e.target.files?.[0]) load(e.target.files[0]); e.target.value = ""; }} />
          <p className="text-4xl mb-3">🎬</p>
          <p className="font-semibold text-slate-700 dark:text-slate-300">Drop a video here</p>
          <p className="mt-1 text-sm text-slate-400">or click to browse</p>
        </label>
      )}

      {error && <div className="mt-4 flex gap-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 px-4 py-3 text-sm text-red-700 dark:text-red-400"><span>⚠️</span><span>{error}</span></div>}
      {done && <div className="mt-4 flex gap-2 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 px-4 py-3 text-sm text-green-700 dark:text-green-400"><span>✅</span><span>GIF created and downloaded!</span></div>}

      {file && (
        <div className="mt-6 space-y-6">
          {/* File row */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <span className="text-xl">🎬</span>
            <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{file.name}</p><p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(1)} MB</p></div>
            <button type="button" onClick={() => { setFile(null); updatePreviewUrl(null); }} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500">✕</button>
          </div>

          {/* Side-by-side previews */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Video preview */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">🎬 Video Preview</p>
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black aspect-video flex items-center justify-center">
                {videoUrl && (
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    muted
                    className="w-full h-full object-contain"
                    onLoadedMetadata={(e) => {
                      const dur = (e.target as HTMLVideoElement).duration;
                      setVideoDuration(isFinite(dur) ? dur : 0);
                    }}
                  />
                )}
              </div>
              <p className="text-xs text-slate-400 text-center">
                {videoDuration > 0 ? `Duration: ${videoDuration.toFixed(1)}s` : ""}
              </p>
            </div>

            {/* GIF preview */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                🎞️ GIF Preview
                {previewBusy && <span className="ml-2 text-xs font-normal text-slate-400 animate-pulse">Generating…</span>}
              </p>
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-video flex items-center justify-center">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="GIF preview" className="max-w-full max-h-full object-contain" />
                ) : (
                  <div className="text-center text-slate-400 text-sm px-4">
                    {previewBusy ? (
                      <span className="animate-pulse">⏳ Generating preview…</span>
                    ) : (
                      <span>Preview will appear here</span>
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 text-center">
                Auto-updates · max 4s · 320px wide for speed
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex justify-between text-sm font-medium text-slate-700 dark:text-slate-300">
                <span>Start (seconds)</span><span className="text-red-600">{start}s</span>
              </div>
              <input type="range" min={0} max={Math.max(maxStart, 0)} step={0.5} value={start}
                onChange={(e) => setStart(Number(e.target.value))} className="w-full accent-red-600" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm font-medium text-slate-700 dark:text-slate-300">
                <span>Duration (seconds)</span><span className="text-red-600">{duration}s</span>
              </div>
              <input type="range" min={1} max={30} value={duration}
                onChange={(e) => setDuration(Number(e.target.value))} className="w-full accent-red-600" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm font-medium text-slate-700 dark:text-slate-300">
                <span>FPS</span><span className="text-red-600">{fps}</span>
              </div>
              <input type="range" min={5} max={30} value={fps}
                onChange={(e) => setFps(Number(e.target.value))} className="w-full accent-red-600" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm font-medium text-slate-700 dark:text-slate-300">
                <span>Width (px)</span><span className="text-red-600">{width}px</span>
              </div>
              <input type="range" min={120} max={800} step={10} value={width}
                onChange={(e) => setWidth(Number(e.target.value))} className="w-full accent-red-600" />
            </div>
          </div>

          {/* Progress bar */}
          {processing && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 bg-slate-50 dark:bg-slate-900">
              <div className="flex justify-between text-xs text-slate-500 mb-1"><span>Creating full-quality GIF…</span><span>{Math.round(progress * 100)}%</span></div>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
            </div>
          )}

          <button type="button" onClick={run} disabled={processing}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-sm transition-colors">
            {processing ? "Creating GIF…" : "🎞️ Create Full-Quality GIF & Download"}
          </button>
        </div>
      )}
      <ProcessingOverlay active={processing} label="Creating GIF…" />
      <p className="mt-8 text-center text-xs text-slate-400">🔒 Everything runs in your browser. Nothing is uploaded to any server.</p>
    </main>
  );
}
