"use client";
import { useState } from "react";
import { mupdfUnlock } from "@/lib/mupdf-utils";

export default function Client() {
  const [status, setStatus] = useState("");
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [password, setPassword] = useState("");

  async function handleFile(file: File) {
    setOutputUrl(null);
    setStatus("Loading...");
    try {
      const buf = await file.arrayBuffer();
      const result = await mupdfUnlock(new Uint8Array(buf), password);
      const blob = new Blob([result as BlobPart], { type: "application/pdf" });
      setOutputUrl(URL.createObjectURL(blob));
      setStatus("Password removed successfully!");
    } catch (e) {
      setStatus("Error: " + (e instanceof Error ? e.message : String(e)));
    }
  }

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🔐</span>
            <h1 className="text-2xl sm:text-3xl font-black">PDF Password Remover</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400">
            Remove password protection from your PDF. Runs entirely in your browser — your files never leave your device.
          </p>
        </div>
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">🔒 100% private — your PDF never leaves your browser.</p>
          <input
            type="text"
            placeholder="Enter PDF password (if known)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="block w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-900 text-sm"
          />
          <input
            type="file"
            accept=".pdf"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="block w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-900 text-sm"
          />
          {status && <p className="text-sm text-slate-500">{status}</p>}
          {outputUrl && (
            <a
              href={outputUrl}
              download="unlocked.pdf"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 font-semibold text-sm"
            >
              Download Unlocked PDF
            </a>
          )}
        </div>
      </main>
  );
}
