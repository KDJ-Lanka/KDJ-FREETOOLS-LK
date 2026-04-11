"use client";

import { useRef, useState, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import ProcessingOverlay from "@/components/ProcessingOverlay";
import { ffExtractAudio, makeBlob } from "@/lib/ffmpeg-utils";

type Chunk = { text: string; timestamp: [number, number | null] };

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

function toSrt(chunks: Chunk[]): string {
  return chunks
    .filter((c) => c.timestamp[0] != null && c.timestamp[1] != null)
    .map((c, i) => {
      const fmt = (s: number) => {
        const h = Math.floor(s / 3600).toString().padStart(2, "0");
        const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
        const sec = Math.floor(s % 60).toString().padStart(2, "0");
        const ms = Math.round((s % 1) * 1000).toString().padStart(3, "0");
        return `${h}:${m}:${sec},${ms}`;
      };
      return `${i + 1}\n${fmt(c.timestamp[0])} --> ${fmt(c.timestamp[1]!)}\n${c.text.trim()}\n`;
    })
    .join("\n");
}

function toVtt(chunks: Chunk[]): string {
  const body = chunks
    .filter((c) => c.timestamp[0] != null && c.timestamp[1] != null)
    .map((c) => {
      const fmt = (s: number) => {
        const h = Math.floor(s / 3600).toString().padStart(2, "0");
        const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
        const sec = Math.floor(s % 60).toString().padStart(2, "0");
        const ms = Math.round((s % 1) * 1000).toString().padStart(3, "0");
        return `${h}:${m}:${sec}.${ms}`;
      };
      return `${fmt(c.timestamp[0])} --> ${fmt(c.timestamp[1]!)}\n${c.text.trim()}`;
    })
    .join("\n\n");
  return `WEBVTT\n\n${body}`;
}

function toText(chunks: Chunk[]): string {
  return chunks.map((c) => c.text.trim()).join(" ");
}

function download(content: string, filename: string, mime: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type: mime }));
  a.download = filename;
  a.click();
}

export default function SubtitleGeneratorClient() {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("english");
  const [status, setStatus] = useState("");
  const [processing, setProcessing] = useState(false);
  const [chunks, setChunks] = useState<Chunk[] | null>(null);
  const [error, setError] = useState("");
  const workerRef = useRef<Worker | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

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

  const handleGenerate = useCallback(async () => {
    if (!file) return;
    setError("");
    setChunks(null);
    setProcessing(true);
    try {
      // Step 1: extract audio to PCM via FFmpeg WASM
      setStatus("Extracting audio…");
      const wavData = await ffExtractAudio(file, "wav");
      const wavBlob = makeBlob(wavData, "audio/wav");
      const arrayBuffer = await wavBlob.arrayBuffer();

      // Decode to Float32 PCM (16 kHz mono required by Whisper)
      const audioCtx = new AudioContext({ sampleRate: 16000 });
      const decoded = await audioCtx.decodeAudioData(arrayBuffer);
      const pcm = decoded.getChannelData(0); // mono

      // Step 2: load model (cached after first run)
      setStatus("Loading model…");
      const worker = await loadWorker();

      // Step 3: transcribe
      setStatus("Transcribing…");
      await new Promise<void>((resolve, reject) => {
        worker.onmessage = (e) => {
          if (e.data.type === "status") setStatus(e.data.message);
          if (e.data.type === "result") {
            const raw = e.data.data;
            const allChunks: Chunk[] = raw.chunks ?? (raw.text ? [{ text: raw.text, timestamp: [0, null] }] : []);
            setChunks(allChunks);
            resolve();
          }
          if (e.data.type === "error") reject(new Error(e.data.message));
        };
        worker.postMessage({ type: "transcribe", audio: pcm, language }, [pcm.buffer]);
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setProcessing(false);
      setStatus("");
    }
  }, [file, language, loadWorker]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }, []);

  const baseName = file ? file.name.replace(/\.[^.]+$/, "") : "subtitles";

  return (
    <ToolLayout>
      <ProcessingOverlay active={processing} label={status || "Processing…"} />
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Subtitle Generator</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Auto-generate subtitles from any video or audio file — free, private, runs entirely in your browser.
          </p>
        </div>

        {/* Drop zone */}
        <div
          ref={dropRef}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => document.getElementById("sub-file-input")?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-10 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
        >
          <input
            id="sub-file-input"
            type="file"
            accept="video/*,audio/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
          />
          <div className="text-4xl mb-3">🎬</div>
          {file ? (
            <p className="font-medium text-slate-700 dark:text-slate-200">{file.name}</p>
          ) : (
            <>
              <p className="font-medium text-slate-700 dark:text-slate-300">Drop a video or audio file here</p>
              <p className="text-sm text-slate-400 mt-1">MP4, MOV, AVI, MKV, WebM, MP3, WAV, M4A…</p>
            </>
          )}
        </div>

        {/* Language selector */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Language (spoken in the video)
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={!file || processing}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {processing ? status || "Processing…" : "Generate Subtitles"}
        </button>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Results */}
        {chunks && chunks.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-slate-800 dark:text-slate-200">✅ Subtitles ready — download below</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => download(toSrt(chunks), `${baseName}.srt`, "text/plain")}
                className="flex-1 min-w-[120px] bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
              >
                ⬇ Download .SRT
              </button>
              <button
                onClick={() => download(toVtt(chunks), `${baseName}.vtt`, "text/vtt")}
                className="flex-1 min-w-[120px] bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
              >
                ⬇ Download .VTT
              </button>
              <button
                onClick={() => download(toText(chunks), `${baseName}.txt`, "text/plain")}
                className="flex-1 min-w-[120px] bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
              >
                ⬇ Download .TXT
              </button>
            </div>

            {/* Preview */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 max-h-64 overflow-y-auto text-sm text-slate-700 dark:text-slate-300 space-y-1 border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Transcript preview</p>
              {chunks.map((c, i) => (
                <p key={i}>
                  {c.timestamp[0] != null && (
                    <span className="text-xs text-blue-500 mr-2 font-mono">
                      {Math.floor(c.timestamp[0] / 60).toString().padStart(2,"0")}:{Math.floor(c.timestamp[0] % 60).toString().padStart(2,"0")}
                    </span>
                  )}
                  {c.text.trim()}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
