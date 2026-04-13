"use client";
import { useState, useRef, useEffect } from "react";
import { getPyodide } from "@/lib/pyodide-utils";
import type { PyodideInterface } from "@/lib/pyodide-utils";

interface Hashes {
  md5: string;
  sha1: string;
  sha224: string;
  sha256: string;
  sha384: string;
  sha512: string;
  blake2b: string;
  size?: number;
}

const HASH_ALGORITHMS: { key: keyof Hashes; label: string; bits: string }[] = [
  { key: "md5",    label: "MD5",     bits: "128-bit" },
  { key: "sha1",   label: "SHA-1",   bits: "160-bit" },
  { key: "sha224", label: "SHA-224", bits: "224-bit" },
  { key: "sha256", label: "SHA-256", bits: "256-bit" },
  { key: "sha384", label: "SHA-384", bits: "384-bit" },
  { key: "sha512", label: "SHA-512", bits: "512-bit" },
  { key: "blake2b",label: "BLAKE2b", bits: "512-bit" },
];

const TEXT_HASH_CODE = `
import hashlib, json

_b = _input_text.encode("utf-8")
json.dumps({
    "md5":    hashlib.md5(_b).hexdigest(),
    "sha1":   hashlib.sha1(_b).hexdigest(),
    "sha224": hashlib.sha224(_b).hexdigest(),
    "sha256": hashlib.sha256(_b).hexdigest(),
    "sha384": hashlib.sha384(_b).hexdigest(),
    "sha512": hashlib.sha512(_b).hexdigest(),
    "blake2b": hashlib.blake2b(_b).hexdigest(),
})
`;

const FILE_HASH_CODE = `
import hashlib, json

_b = bytes(_file_bytes)
json.dumps({
    "md5":    hashlib.md5(_b).hexdigest(),
    "sha1":   hashlib.sha1(_b).hexdigest(),
    "sha224": hashlib.sha224(_b).hexdigest(),
    "sha256": hashlib.sha256(_b).hexdigest(),
    "sha384": hashlib.sha384(_b).hexdigest(),
    "sha512": hashlib.sha512(_b).hexdigest(),
    "blake2b": hashlib.blake2b(_b).hexdigest(),
    "size": len(_b),
})
`;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="shrink-0 text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-green-100 dark:hover:bg-green-900/40 text-slate-600 dark:text-slate-300 transition-colors font-medium"
    >
      {copied ? "✓" : "Copy"}
    </button>
  );
}

export default function Client() {
  const [mode, setMode] = useState<"text" | "file">("text");
  const [inputText, setInputText] = useState("Hello, FreeTools.lk!");
  const [fileName, setFileName] = useState("");
  const [hashes, setHashes] = useState<Hashes | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const pyRef = useRef<PyodideInterface | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function ensurePyodide() {
    if (!pyRef.current) {
      setLoading(true);
      pyRef.current = await getPyodide(setStatus);
      setStatus("");
      setLoading(false);
    }
    return pyRef.current;
  }

  // Auto-hash text as user types
  useEffect(() => {
    if (mode !== "text") return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const py = await ensurePyodide();
        py.globals.set("_input_text", inputText);
        const raw = (await py.runPythonAsync(TEXT_HASH_CODE)) as string;
        setHashes(JSON.parse(raw));
      } catch (e) {
        console.error(e);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [inputText, mode]);

  async function handleFile(file: File) {
    setFileName(file.name);
    setHashes(null);

    try {
      const py = await ensurePyodide();
      const buf = await file.arrayBuffer();
      const uint8 = new Uint8Array(buf);
      py.globals.set("_file_bytes", uint8);
      const raw = (await py.runPythonAsync(FILE_HASH_CODE)) as string;
      setHashes(JSON.parse(raw));
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🔐</span>
          <h1 className="text-2xl sm:text-3xl font-black">Hash Generator</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400">
          Generate MD5, SHA-1, SHA-256, SHA-512 and more — 100% private, data never leaves your browser.
        </p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2 mb-5">
        {(["text", "file"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setHashes(null); setFileName(""); }}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
              mode === m
                ? "bg-green-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {m === "text" ? "📝 Text" : "📁 File"}
          </button>
        ))}
      </div>

      {/* Input area */}
      {mode === "text" ? (
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={4}
          placeholder="Type or paste text to hash…"
          className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      ) : (
        <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 cursor-pointer hover:border-green-400 dark:hover:border-green-600 transition-colors bg-slate-50 dark:bg-slate-900/50">
          <span className="text-3xl">📂</span>
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            {fileName ? `✓ ${fileName}` : "Click or drop any file here"}
          </span>
          <span className="text-xs text-slate-400">Any file type — stays in your browser</span>
          <input
            type="file"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </label>
      )}

      {/* Status / loading */}
      {(loading || status) && (
        <p className="mt-3 text-sm text-blue-500 flex items-center gap-2">
          <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          {status || "Hashing…"}
        </p>
      )}

      {/* Hash results */}
      {hashes && (
        <div className="mt-6 space-y-2">
          {hashes.size !== undefined && (
            <p className="text-sm text-slate-500 mb-3">
              File size: <span className="font-semibold text-slate-700 dark:text-slate-300">{(hashes.size! / 1024).toFixed(2)} KB</span>
            </p>
          )}
          {HASH_ALGORITHMS.map(({ key, label, bits }) => {
            const value = hashes[key] as string | undefined;
            if (!value) return null;
            return (
              <div
                key={key}
                className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <div className="shrink-0 w-20 text-right">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{label}</p>
                  <p className="text-[10px] text-slate-400">{bits}</p>
                </div>
                <p className="flex-1 font-mono text-xs text-slate-600 dark:text-slate-300 break-all leading-relaxed pt-0.5">
                  {value}
                </p>
                <CopyButton text={value} />
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-8 text-xs text-slate-400 dark:text-slate-500">
        ⚡ MD5/SHA-1 shown for legacy compatibility — use SHA-256+ for security. Runs entirely in your browser.
      </p>
    </main>
  );
}
