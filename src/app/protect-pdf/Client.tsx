"use client";

import ProcessingOverlay from "@/components/ProcessingOverlay";

import { useCallback, useState } from "react";
import { mupdfProtect } from "@/lib/mupdf-utils";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const INPUT_ID = "protect-pdf-file-input";

export default function ProtectPdfClient() {
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [userPwd, setUserPwd] = useState("");
  const [ownerPwd, setOwnerPwd] = useState("");
  const [showUser, setShowUser] = useState(false);
  const [showOwner, setShowOwner] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [dragging, setDragging] = useState(false);

  const loadFile = useCallback((file: File) => {
    setError(null);
    setDone(false);
    if (file.type !== "application/pdf") { setError(`"${file.name}" is not a PDF.`); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      setBytes(new Uint8Array(e.target!.result as ArrayBuffer));
      setFileName(file.name);
      setFileSize(file.size);
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) loadFile(e.target.files[0]);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.[0]) loadFile(e.dataTransfer.files[0]);
  };

  const protect = async () => {
    if (!bytes) return;
    if (!userPwd.trim()) { setError("User password is required."); return; }
    setError(null);
    setProcessing(true);
    try {
      const out = await mupdfProtect(bytes, userPwd, ownerPwd);
      const blob = new Blob([out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName.replace(/\.pdf$/i, "")}-protected.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to protect PDF.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🔐</span>
          <h1 className="text-2xl sm:text-3xl font-black">Protect PDF</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400">
          Password-protect your PDF so only authorized users can open it. Everything runs in your browser.
        </p>
      </div>

      <label
        htmlFor={INPUT_ID}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`cursor-pointer flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
          dragging ? "border-red-400 bg-red-50 dark:bg-red-950/20" : "border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-800 hover:bg-slate-50 dark:hover:bg-slate-900"
        }`}
      >
        <input id={INPUT_ID} type="file" accept="application/pdf" className="sr-only" onChange={onInputChange} />
        <p className="text-4xl mb-3">📄</p>
        <p className="font-semibold text-slate-700 dark:text-slate-300">Drop a PDF here</p>
        <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">or click to browse</p>
      </label>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <span className="mt-0.5">⚠️</span><span>{error}</span>
        </div>
      )}
      {done && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          <span>✅</span><span>Protected PDF downloaded successfully!</span>
        </div>
      )}

      {bytes && (
        <div className="mt-6 space-y-5">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <span className="text-xl">📄</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{fileName}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{formatSize(fileSize)}</p>
            </div>
            <button type="button" onClick={() => { setBytes(null); setDone(false); }}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-sm">✕</button>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              User password <span className="text-red-500">*</span>
              <span className="font-normal text-slate-400 dark:text-slate-500 ml-1">(required to open)</span>
            </label>
            <div className="relative">
              <input
                type={showUser ? "text" : "password"}
                value={userPwd}
                onChange={(e) => setUserPwd(e.target.value)}
                placeholder="Enter user password"
                className="w-full px-3 py-2 pr-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button type="button" onClick={() => setShowUser(!showUser)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs px-1">
                {showUser ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Owner password
              <span className="font-normal text-slate-400 dark:text-slate-500 ml-1">(optional, for permissions)</span>
            </label>
            <div className="relative">
              <input
                type={showOwner ? "text" : "password"}
                value={ownerPwd}
                onChange={(e) => setOwnerPwd(e.target.value)}
                placeholder="Enter owner password (optional)"
                className="w-full px-3 py-2 pr-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button type="button" onClick={() => setShowOwner(!showOwner)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs px-1">
                {showOwner ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={protect}
            disabled={processing}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {processing ? (
              <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Protecting…</>
            ) : <>🔐 Protect &amp; Download</>}
          </button>
        </div>
      )}

      <p className="mt-10 text-center text-xs text-slate-400 dark:text-slate-500">
        🔒 Your files are processed entirely in your browser. Nothing is uploaded to any server.
      </p>
          <ProcessingOverlay active={processing} />
    </main>
  );
}
