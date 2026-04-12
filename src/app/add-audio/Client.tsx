"use client";
import ProcessingOverlay from "@/components/ProcessingOverlay";
import { useCallback, useState } from "react";
import { ffAddAudioToVideo, makeBlob, triggerDownload } from "@/lib/ffmpeg-utils";

const VIDEO_ID = "add-audio-video-input";
const AUDIO_ID = "add-audio-audio-input";

export default function AddAudioClient() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [draggingV, setDraggingV] = useState(false);
  const [draggingA, setDraggingA] = useState(false);

  const loadVideo = useCallback((f: File) => {
    if (!f.type.startsWith("video/")) { setError(`"${f.name}" is not a video file.`); return; }
    setVideoFile(f); setError(null); setDone(false);
  }, []);

  const loadAudio = useCallback((f: File) => {
    if (!f.type.startsWith("audio/")) { setError(`"${f.name}" is not an audio file.`); return; }
    setAudioFile(f); setError(null); setDone(false);
  }, []);

  const run = async () => {
    if (!videoFile || !audioFile) return;
    setError(null); setProcessing(true); setProgress(0);
    try {
      const out = await ffAddAudioToVideo(videoFile, audioFile, setProgress);
      triggerDownload(makeBlob(out, "video/mp4"), videoFile.name.replace(/\.[^.]+$/, "_with_audio.mp4"));
      setDone(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Processing failed."); }
    finally { setProcessing(false); }
  };

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2"><span className="text-3xl">🔊</span><h1 className="text-2xl sm:text-3xl font-black">Add Audio to Video</h1></div>
        <p className="text-slate-500 dark:text-slate-400">Replace or add an audio track to any video. The video length is preserved (audio is trimmed or video is cut to shorter). Runs in your browser.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Video drop */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">1. Video file</label>
          <label htmlFor={VIDEO_ID} onDragOver={(e) => { e.preventDefault(); setDraggingV(true); }} onDragLeave={() => setDraggingV(false)}
            onDrop={(e) => { e.preventDefault(); setDraggingV(false); if (e.dataTransfer.files?.[0]) loadVideo(e.dataTransfer.files[0]); }}
            className={`cursor-pointer flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors ${draggingV ? "border-red-400 bg-red-50 dark:bg-red-950/20" : videoFile ? "border-green-400 bg-green-50 dark:bg-green-950/20" : "border-slate-200 dark:border-slate-700 hover:border-red-300 hover:bg-slate-50 dark:hover:bg-slate-900"}`}>
            <input id={VIDEO_ID} type="file" accept="video/*" className="sr-only" onChange={(e) => { if (e.target.files?.[0]) loadVideo(e.target.files[0]); e.target.value = ""; }} />
            <p className="text-3xl mb-2">🎬</p>
            {videoFile ? <p className="text-sm font-medium text-green-700 dark:text-green-400 truncate max-w-full px-2">{videoFile.name}</p> : <><p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Drop video</p><p className="text-xs text-slate-400 mt-1">MP4, MOV, AVI…</p></>}
          </label>
        </div>

        {/* Audio drop */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">2. Audio file</label>
          <label htmlFor={AUDIO_ID} onDragOver={(e) => { e.preventDefault(); setDraggingA(true); }} onDragLeave={() => setDraggingA(false)}
            onDrop={(e) => { e.preventDefault(); setDraggingA(false); if (e.dataTransfer.files?.[0]) loadAudio(e.dataTransfer.files[0]); }}
            className={`cursor-pointer flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors ${draggingA ? "border-red-400 bg-red-50 dark:bg-red-950/20" : audioFile ? "border-green-400 bg-green-50 dark:bg-green-950/20" : "border-slate-200 dark:border-slate-700 hover:border-red-300 hover:bg-slate-50 dark:hover:bg-slate-900"}`}>
            <input id={AUDIO_ID} type="file" accept="audio/*" className="sr-only" onChange={(e) => { if (e.target.files?.[0]) loadAudio(e.target.files[0]); e.target.value = ""; }} />
            <p className="text-3xl mb-2">🎵</p>
            {audioFile ? <p className="text-sm font-medium text-green-700 dark:text-green-400 truncate max-w-full px-2">{audioFile.name}</p> : <><p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Drop audio</p><p className="text-xs text-slate-400 mt-1">MP3, WAV, AAC…</p></>}
          </label>
        </div>
      </div>

      {error && <div className="mt-4 flex gap-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-4 py-3 text-sm text-red-700 dark:text-red-400"><span>⚠️</span><span>{error}</span></div>}
      {done && <div className="mt-4 flex gap-2 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 px-4 py-3 text-sm text-green-700 dark:text-green-400"><span>✅</span><span>Video with new audio downloaded!</span></div>}

      {(videoFile || audioFile) && (
        <div className="mt-6 space-y-4">
          {processing && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 bg-slate-50 dark:bg-slate-900">
              <div className="flex justify-between text-xs text-slate-500 mb-1"><span>Processing…</span><span>{Math.round(progress * 100)}%</span></div>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div className="h-full bg-red-500 rounded-full transition-all duration-300" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
            </div>
          )}
          <button type="button" onClick={run} disabled={processing || !videoFile || !audioFile}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-sm transition-colors">
            {processing ? "Processing…" : "🔊 Add Audio & Download"}
          </button>
        </div>
      )}
      <ProcessingOverlay active={processing} label="Adding audio to video…" />
    </main>
  );
}
