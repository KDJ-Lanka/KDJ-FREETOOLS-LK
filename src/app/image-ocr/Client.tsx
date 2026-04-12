"use client";
import { useState } from "react";

export default function Client() {
  const [status, setStatus] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleFile(file: File) {
    setLoading(true);
    setText("");
    setStatus("Loading OCR engine...");
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng", 1, {
        logger: (m: { status: string; progress: number }) =>
          setStatus(`${m.status}: ${Math.round(m.progress * 100)}%`),
      });
      const { data } = await worker.recognize(file);
      setText(data.text);
      await worker.terminate();
      setStatus("Done!");
    } catch (e) {
      setStatus("Error: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">📄</span>
          <h1 className="text-2xl sm:text-3xl font-black">Image to Text (OCR)</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400">
          Extract text from images using Tesseract.js. Runs entirely in your browser — no uploads.
        </p>
      </div>
      <div className="space-y-4">
        <input
          type="file"
          accept="image/*"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="block w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-900 text-sm"
        />
        {status && <p className="text-sm text-slate-500">{status}</p>}
        {text && (
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Extracted Text:</label>
            <textarea
              value={text}
              readOnly
              rows={12}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 mt-1 font-mono text-sm bg-white dark:bg-slate-900"
            />
            <button
              onClick={() => navigator.clipboard.writeText(text)}
              className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 font-semibold text-sm"
            >
              Copy Text
            </button>
          </div>
        )}
        {loading && <p className="text-sm text-blue-500">Processing... this may take a moment.</p>}
      </div>
    </main>
  );
}

