"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import ProcessingOverlay from "@/components/ProcessingOverlay";
import { ffExtractAudio, makeBlob } from "@/lib/ffmpeg-utils";

type Chunk = { id: string; start: number; end: number; text: string };

const LANGUAGES = [
  { value: "english", label: "English" },
  { value: "sinhala", label: "Sinhala (සිංහල)" },
  { value: "tamil", label: "Tamil (தமிழ்)" },
  { value: "hindi", label: "Hindi" },
  { value: "arabic", label: "Arabic" },
  { value: "french", label: "French" },
  { value: "spanish", label: "Spanish" },
  { value: "german", label: "German" },
  { value: "chinese", label: "Chinese" },
  { value: "japanese", label: "Japanese" },
];

function fmtSrt(s: number) {
  const h = Math.floor(s / 3600).toString().padStart(2, "0");
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  const ms = Math.round((s % 1) * 1000).toString().padStart(3, "0");
  return `${h}:${m}:${sec},${ms}`;
}
function fmtVtt(s: number) { return fmtSrt(s).replace(",", "."); }
function fmtDisplay(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  const ms = Math.round((s % 1) * 10);
  return `${m}:${sec}.${ms}`;
}
function parseSec(v: string): number {
  const parts = v.replace(",", ".").split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] ?? 0;
}

function toSrt(chunks: Chunk[]) {
  return chunks.map((c, i) => `${i + 1}\n${fmtSrt(c.start)} --> ${fmtSrt(c.end)}\n${c.text.trim()}\n`).join("\n");
}
function toVtt(chunks: Chunk[]) {
  return "WEBVTT\n\n" + chunks.map((c) => `${fmtVtt(c.start)} --> ${fmtVtt(c.end)}\n${c.text.trim()}`).join("\n\n");
}
function toTxt(chunks: Chunk[]) { return chunks.map((c) => c.text.trim()).join(" "); }

function downloadFile(content: string, filename: string, mime: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type: mime }));
  a.download = filename;
  a.click();
}

function uid() { return Math.random().toString(36).slice(2); }

export default function SubtitleGeneratorClient() {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("english");
  const [status, setStatus] = useState("");
  const [processing, setProcessing] = useState(false);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [editingTime, setEditingTime] = useState<{ id: string; field: "start" | "end"; val: string } | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isVideo = file?.type.startsWith("video/");

  useEffect(() => {
    if (!file) { setMediaUrl(null); return; }
    const url = URL.createObjectURL(file);
    setMediaUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Highlight active caption based on playback time
  useEffect(() => {
    if (!chunks.length) return;
    const active = chunks.find((c) => currentTime >= c.start && currentTime <= c.end);
    if (active && active.id !== activeId) {
      setActiveId(active.id);
      rowRefs.current[active.id]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [currentTime, chunks, activeId]);

  const loadWorker = useCallback((): Promise<Worker> => {
    return new Promise((resolve, reject) => {
      if (workerRef.current) { resolve(workerRef.current); return; }
      const w = new Worker(new URL("./whisper.worker.ts", import.meta.url), { type: "module" });
      workerRef.current = w;
      w.onmessage = (e) => {
        if (e.data.type === "ready") resolve(w);
        if (e.data.type === "status") setStatus(e.data.message);
        if (e.data.type === "error") reject(new Error(e.data.message));
      };
      w.postMessage({ type: "load" });
    });
  }, []);

  const run = async () => {
    if (!file) return;
    setError(null); setChunks([]); setProcessing(true);
    try {
      setStatus("Extracting audio...");
      const wavData = await ffExtractAudio(file, "wav");
      const wavBlob = makeBlob(wavData, "audio/wav");
      const arrayBuffer = await wavBlob.arrayBuffer();
      const audioCtx = new AudioContext({ sampleRate: 16000 });
      const decoded = await audioCtx.decodeAudioData(arrayBuffer);
      const pcm = decoded.getChannelData(0);

      setStatus("Preparing, please wait...");
      const worker = await loadWorker();

      setStatus("Generating subtitles...");
      await new Promise<void>((resolve, reject) => {
        worker.onmessage = (e) => {
          if (e.data.type === "status") setStatus(e.data.message);
          if (e.data.type === "chunk") {
            const incoming = (e.data.data as { text: string; timestamp: [number, number | null] }[]);
            const parsed: Chunk[] = incoming.map((c) => ({
              id: uid(),
              start: c.timestamp[0] ?? 0,
              end: c.timestamp[1] ?? (c.timestamp[0] ?? 0) + 3,
              text: c.text,
            }));
            setChunks((prev) => [...prev, ...parsed]);
          }
          if (e.data.type === "done") resolve();
          if (e.data.type === "error") reject(new Error(e.data.message));
        };
        worker.postMessage({ type: "transcribe", audio: pcm, language }, [pcm.buffer]);
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setProcessing(false); setStatus("");
    }
  };

  const seekTo = (time: number) => {
    if (mediaRef.current) mediaRef.current.currentTime = time;
  };

  const updateChunk = (id: string, field: keyof Chunk, value: string | number) => {
    setChunks((prev) => prev.map((c) => c.id === id ? { ...c, [field]: value } : c));
  };

  const addAfter = (id: string) => {
    setChunks((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      const ref = prev[idx];
      const newChunk: Chunk = { id: uid(), start: ref.end, end: ref.end + 2, text: "" };
      const next = [...prev];
      next.splice(idx + 1, 0, newChunk);
      return next;
    });
  };

  const deleteChunk = (id: string) => {
    setChunks((prev) => prev.filter((c) => c.id !== id));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setChunks([]); setError(null); setActiveId(null); }
  };

  const baseName = file ? file.name.replace(/\.[^.]+$/, "") : "subtitles";

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-10">
      <ProcessingOverlay active={processing && chunks.length === 0} label={status || "Processing..."} />

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">💬</span>
          <h1 className="text-2xl sm:text-3xl font-black">Subtitle Generator</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Auto-generate subtitles from any video or audio. Edit captions inline, then download as SRT, VTT or TXT. Everything runs in your browser — files never leave your device.
        </p>
      </div>

      {/* Top area: upload or player */}
      {!file ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onClick={() => document.getElementById("sub-file-input")?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors mb-6 ${dragging ? "border-red-400 bg-red-50 dark:bg-red-950/20" : "border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-600"}`}
        >
          <input id="sub-file-input" type="file" accept="video/*,audio/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); setChunks([]); setError(null); } }} />
          <div className="text-5xl mb-3">🎬</div>
          <p className="font-semibold text-slate-700 dark:text-slate-300">Drop a video or audio file here</p>
          <p className="text-sm text-slate-400 mt-1">MP4, MOV, AVI, MKV, WebM, MP3, WAV, M4A…</p>
        </div>
      ) : (
        <div className="mb-6 space-y-3">
          {/* Media player */}
          <div className="rounded-2xl overflow-hidden bg-black border border-slate-200 dark:border-slate-700">
            {isVideo ? (
              <video
                ref={mediaRef as React.RefObject<HTMLVideoElement>}
                src={mediaUrl ?? undefined}
                controls
                className="w-full max-h-64 object-contain"
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              />
            ) : (
              <audio
                ref={mediaRef as React.RefObject<HTMLAudioElement>}
                src={mediaUrl ?? undefined}
                controls
                className="w-full p-3"
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              />
            )}
          </div>
          {/* File info + change */}
          <div className="flex items-center justify-between px-1">
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs">{file.name}</p>
            <button
              onClick={() => { setFile(null); setChunks([]); setActiveId(null); workerRef.current = null; }}
              className="text-xs text-red-500 hover:underline"
            >Change file</button>
          </div>
        </div>
      )}

      {file && chunks.length === 0 && (
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Language spoken in the video</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500">
              {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div>
            <button onClick={run} disabled={processing}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors">
            Generate Subtitles
          </button>
        </div>
        </div>
      )}

      {error && (
        <div className="flex gap-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-4 py-3 text-sm text-red-700 dark:text-red-400 mb-4">
          <span>⚠️</span><span>{error}</span>
        </div>
      )}

      {/* Caption timeline editor */}
      {chunks.length > 0 && (
        <div className="space-y-4">
          {/* Streaming progress banner */}
          {processing && chunks.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 text-sm text-red-700 dark:text-red-400">
              <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              <span>{status || "Generating subtitles..."}</span>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{chunks.length} captions — click any row to seek, edit text inline</p>
            <div className="flex gap-2 flex-wrap">
              <button onClick={run} className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                🔄 Re-generate
              </button>
              <button onClick={() => downloadFile(toSrt(chunks), `${baseName}.srt`, "text/plain")}
                className="text-xs px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors">⬇ SRT</button>
              <button onClick={() => downloadFile(toVtt(chunks), `${baseName}.vtt`, "text/vtt")}
                className="text-xs px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors">⬇ VTT</button>
              <button onClick={() => downloadFile(toTxt(chunks), `${baseName}.txt`, "text/plain")}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-600 hover:bg-slate-700 text-white font-semibold transition-colors">⬇ TXT</button>
            </div>
          </div>

          {/* Caption rows */}
          <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
            {chunks.map((chunk, idx) => {
              const isActive = chunk.id === activeId;
              return (
                <div
                  key={chunk.id}
                  ref={(el) => { rowRefs.current[chunk.id] = el; }}
                  className={`group flex items-start gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
                    isActive
                      ? "border-red-400 bg-red-50 dark:bg-red-950/30"
                      : "border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800 bg-white dark:bg-slate-900"
                  }`}
                >
                  {/* Index */}
                  <span className="text-xs text-slate-400 font-mono w-5 pt-2 shrink-0 select-none">{idx + 1}</span>

                  {/* Timestamps */}
                  <div className="flex flex-col gap-1 shrink-0 w-28">
                    {/* Start */}
                    {editingTime?.id === chunk.id && editingTime.field === "start" ? (
                      <input
                        autoFocus
                        className="text-xs font-mono px-1.5 py-0.5 rounded border border-blue-400 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-300 w-full focus:outline-none"
                        value={editingTime.val}
                        onChange={(e) => setEditingTime({ ...editingTime, val: e.target.value })}
                        onBlur={() => { updateChunk(chunk.id, "start", parseSec(editingTime.val)); setEditingTime(null); }}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Tab") { updateChunk(chunk.id, "start", parseSec(editingTime.val)); setEditingTime(null); } }}
                      />
                    ) : (
                      <button
                        onClick={() => { seekTo(chunk.start); setEditingTime({ id: chunk.id, field: "start", val: fmtDisplay(chunk.start) }); }}
                        className="text-xs font-mono text-left px-1.5 py-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                        title="Click to seek / edit"
                      >▶ {fmtDisplay(chunk.start)}</button>
                    )}
                    {/* End */}
                    {editingTime?.id === chunk.id && editingTime.field === "end" ? (
                      <input
                        autoFocus
                        className="text-xs font-mono px-1.5 py-0.5 rounded border border-slate-400 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 w-full focus:outline-none"
                        value={editingTime.val}
                        onChange={(e) => setEditingTime({ ...editingTime, val: e.target.value })}
                        onBlur={() => { updateChunk(chunk.id, "end", parseSec(editingTime.val)); setEditingTime(null); }}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Tab") { updateChunk(chunk.id, "end", parseSec(editingTime.val)); setEditingTime(null); } }}
                      />
                    ) : (
                      <button
                        onClick={() => setEditingTime({ id: chunk.id, field: "end", val: fmtDisplay(chunk.end) })}
                        className="text-xs font-mono text-left px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
                        title="Click to edit end time"
                      >■ {fmtDisplay(chunk.end)}</button>
                    )}
                  </div>

                  {/* Text */}
                  <textarea
                    value={chunk.text}
                    onChange={(e) => updateChunk(chunk.id, "text", e.target.value)}
                    rows={chunk.text.length > 80 ? 2 : 1}
                    className="flex-1 text-sm bg-transparent resize-none focus:outline-none text-slate-800 dark:text-slate-200 leading-relaxed py-0.5"
                    placeholder="Caption text..."
                  />

                  {/* Actions */}
                  <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                    <button onClick={() => addAfter(chunk.id)}
                      title="Add caption after"
                      className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors text-xs">+</button>
                    <button onClick={() => deleteChunk(chunk.id)}
                      title="Delete caption"
                      className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-xs">✕</button>
                  </div>
                </div>
              );
            })}

            {/* Add at end */}
            <button
              onClick={() => {
                const last = chunks[chunks.length - 1];
                setChunks((prev) => [...prev, { id: uid(), start: last ? last.end : 0, end: (last ? last.end : 0) + 2, text: "" }]);
              }}
              className="w-full py-2 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-sm text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
            >+ Add caption</button>
          </div>

          {/* Bottom download bar */}
          <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button onClick={() => downloadFile(toSrt(chunks), `${baseName}.srt`, "text/plain")}
              className="flex-1 min-w-[100px] bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">⬇ Download .SRT</button>
            <button onClick={() => downloadFile(toVtt(chunks), `${baseName}.vtt`, "text/vtt")}
              className="flex-1 min-w-[100px] bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">⬇ Download .VTT</button>
            <button onClick={() => downloadFile(toTxt(chunks), `${baseName}.txt`, "text/plain")}
              className="flex-1 min-w-[100px] bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">⬇ Download .TXT</button>
          </div>
        </div>
      )}
    </main>
  );
}