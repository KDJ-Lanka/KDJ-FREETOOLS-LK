"use client";
import ProcessingOverlay from "@/components/ProcessingOverlay";
import { useCallback, useState } from "react";
import { ffAudioMerge, makeBlob, triggerDownload } from "@/lib/ffmpeg-utils";

const INPUT_ID = "audio-merge-input";

export default function AudioMergeClient() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [dragging, setDragging] = useState(false);

  const addFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return;
    const valid: File[] = [];
    for (const f of Array.from(newFiles)) {
      if (!f.type.startsWith("audio/")) { setError(`"${f.name}" is not an audio file.`); continue; }
      valid.push(f);
    }
    setFiles(prev => [...prev, ...valid].slice(0, 10));
    setError(null); setDone(false);
  }, []);

  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const run = async () => {
    if (files.length < 2) { setError("Add at least 2 audio files to merge."); return; }
    setError(null); setProcessing(true); setProgress(0);
    try {
      const out = await ffAudioMerge(files, setProgress);
      triggerDownload(makeBlob(out, "audio/mpeg"), "merged.mp3");
      setDone(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Merge failed."); }
    finally { setProcessing(false); }
  };

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2"><span className="text-3xl">🔗</span><h1 className="text-2xl sm:text-3xl font-black">Merge Audio Files</h1></div>
        <p className="text-slate-500 dark:text-slate-400">Concatenate up to 10 audio files into a single MP3. Files are joined in the order listed. Runs in your browser.</p>
      </div>

      <label htmlFor={INPUT_ID} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        className={`cursor-pointer flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${dragging ? "border-red-400 bg-red-50 dark:bg-red-950/20" : "border-slate-200 dark:border-slate-700 hover:border-red-300 hover:bg-slate-50 dark:hover:bg-slate-900"}`}>
        <input id={INPUT_ID} type="file" accept="audio/*" multiple className="sr-only" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
        <p className="text-4xl mb-3">🎵</p>
        <p className="font-semibold text-slate-700 dark:text-slate-300">Drop audio files here</p>
        <p className="mt-1 text-sm text-slate-400">or click to browse · up to 10 files · MP3, WAV, AAC…</p>
      </label>

      {error && <div className="mt-4 flex gap-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-4 py-3 text-sm text-red-700 dark:text-red-400"><span>⚠️</span><span>{error}</span></div>}
      {done && <div className="mt-4 flex gap-2 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 px-4 py-3 text-sm text-green-700 dark:text-green-400"><span>✅</span><span>Merged audio downloaded as merged.mp3!</span></div>}

      {files.length > 0 && (
        <div className="mt-6 space-y-5">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Files to merge ({files.length}/10)</p>
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-slate-400 text-xs font-mono w-5 text-right">{i + 1}</span>
                <span className="text-lg">🎵</span>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{f.name}</p><p className="text-xs text-slate-400">{(f.size / 1024 / 1024).toFixed(1)} MB</p></div>
                <button type="button" onClick={() => removeFile(i)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500">✕</button>
              </div>
            ))}
          </div>

          {processing && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 bg-slate-50 dark:bg-slate-900">
              <div className="flex justify-between text-xs text-slate-500 mb-1"><span>Merging…</span><span>{Math.round(progress * 100)}%</span></div>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div className="h-full bg-red-500 rounded-full transition-all duration-300" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
            </div>
          )}

          <button type="button" onClick={run} disabled={processing || files.length < 2}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-sm transition-colors">
            {processing ? "Merging…" : `🔗 Merge ${files.length} Files & Download`}
          </button>
        </div>
      )}
      <ProcessingOverlay active={processing} label="Merging audio files…" />
    </main>
  );
}
