"use client";
import ProcessingOverlay from "@/components/ProcessingOverlay";
import { useCallback, useState } from "react";
import { ffAudioToVideo, makeBlob, triggerDownload } from "@/lib/ffmpeg-utils";

const AUDIO_ID = "audio-to-video-audio-input";
const IMAGE_ID = "audio-to-video-image-input";

export default function AudioToVideoClient() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [draggingA, setDraggingA] = useState(false);
  const [draggingI, setDraggingI] = useState(false);

  const loadAudio = useCallback((f: File) => {
    if (!f.type.startsWith("audio/")) { setError(`"${f.name}" is not an audio file.`); return; }
    setAudioFile(f); setError(null); setDone(false);
  }, []);

  const loadImage = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) { setError(`"${f.name}" is not an image file.`); return; }
    setImageFile(f); setError(null); setDone(false);
  }, []);

  const run = async () => {
    if (!audioFile || !imageFile) return;
    setError(null); setProcessing(true); setProgress(0);
    try {
      const out = await ffAudioToVideo(audioFile, imageFile, setProgress);
      triggerDownload(makeBlob(out, "video/mp4"), audioFile.name.replace(/\.[^.]+$/, "_video.mp4"));
      setDone(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Processing failed."); }
    finally { setProcessing(false); }
  };

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2"><span className="text-3xl">🎞️</span><h1 className="text-2xl sm:text-3xl font-black">Audio to Video</h1></div>
        <p className="text-slate-500 dark:text-slate-400">Combine audio with a cover image to create a shareable MP4 video. Perfect for sharing music on social media. Runs in your browser.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">1. Audio file</label>
          <label htmlFor={AUDIO_ID} onDragOver={(e) => { e.preventDefault(); setDraggingA(true); }} onDragLeave={() => setDraggingA(false)}
            onDrop={(e) => { e.preventDefault(); setDraggingA(false); if (e.dataTransfer.files?.[0]) loadAudio(e.dataTransfer.files[0]); }}
            className={`cursor-pointer flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors ${draggingA ? "border-red-400 bg-red-50 dark:bg-red-950/20" : audioFile ? "border-green-400 bg-green-50 dark:bg-green-950/20" : "border-slate-200 dark:border-slate-700 hover:border-red-300 hover:bg-slate-50 dark:hover:bg-slate-900"}`}>
            <input id={AUDIO_ID} type="file" accept="audio/*" className="sr-only" onChange={(e) => { if (e.target.files?.[0]) loadAudio(e.target.files[0]); e.target.value = ""; }} />
            <p className="text-3xl mb-2">🎵</p>
            {audioFile ? <p className="text-sm font-medium text-green-700 dark:text-green-400 truncate max-w-full px-2">{audioFile.name}</p> : <><p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Drop audio</p><p className="text-xs text-slate-400 mt-1">MP3, WAV, AAC…</p></>}
          </label>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">2. Cover image</label>
          <label htmlFor={IMAGE_ID} onDragOver={(e) => { e.preventDefault(); setDraggingI(true); }} onDragLeave={() => setDraggingI(false)}
            onDrop={(e) => { e.preventDefault(); setDraggingI(false); if (e.dataTransfer.files?.[0]) loadImage(e.dataTransfer.files[0]); }}
            className={`cursor-pointer flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors ${draggingI ? "border-red-400 bg-red-50 dark:bg-red-950/20" : imageFile ? "border-green-400 bg-green-50 dark:bg-green-950/20" : "border-slate-200 dark:border-slate-700 hover:border-red-300 hover:bg-slate-50 dark:hover:bg-slate-900"}`}>
            <input id={IMAGE_ID} type="file" accept="image/*" className="sr-only" onChange={(e) => { if (e.target.files?.[0]) loadImage(e.target.files[0]); e.target.value = ""; }} />
            <p className="text-3xl mb-2">🖼️</p>
            {imageFile ? <p className="text-sm font-medium text-green-700 dark:text-green-400 truncate max-w-full px-2">{imageFile.name}</p> : <><p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Drop cover image</p><p className="text-xs text-slate-400 mt-1">JPG, PNG, WebP…</p></>}
          </label>
        </div>
      </div>

      {error && <div className="mt-4 flex gap-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-4 py-3 text-sm text-red-700 dark:text-red-400"><span>⚠️</span><span>{error}</span></div>}
      {done && <div className="mt-4 flex gap-2 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 px-4 py-3 text-sm text-green-700 dark:text-green-400"><span>✅</span><span>Video downloaded!</span></div>}

      {(audioFile || imageFile) && (
        <div className="mt-6 space-y-4">
          {processing && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 bg-slate-50 dark:bg-slate-900">
              <div className="flex justify-between text-xs text-slate-500 mb-1"><span>Creating video…</span><span>{Math.round(progress * 100)}%</span></div>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div className="h-full bg-red-500 rounded-full transition-all duration-300" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
            </div>
          )}
          <button type="button" onClick={run} disabled={processing || !audioFile || !imageFile}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-sm transition-colors">
            {processing ? "Creating video…" : "🎞️ Create Video & Download"}
          </button>
        </div>
      )}
      <ProcessingOverlay active={processing} label="Creating video from audio…" />
    </main>
  );
}
