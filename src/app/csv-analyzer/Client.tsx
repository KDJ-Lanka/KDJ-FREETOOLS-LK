"use client";
import { useState, useRef } from "react";
import { getPyodide } from "@/lib/pyodide-utils";
import type { PyodideInterface } from "@/lib/pyodide-utils";

interface ColStat {
  name: string;
  type: "numeric" | "text";
  missing: number;
  unique: number;
  min?: string;
  max?: string;
  mean?: string;
  median?: string;
}

interface CsvResult {
  rows: number;
  cols: number;
  headers: string[];
  preview: string[][];
  stats: ColStat[];
  error?: string;
}

const ANALYSIS_CODE = `
import csv, io, json, statistics

_reader = csv.DictReader(io.StringIO(_csv_text))
_rows = list(_reader)
_headers = _reader.fieldnames or []

def _analyze_col(name):
    vals = [r.get(name, "") for r in _rows]
    missing = sum(1 for v in vals if v.strip() == "")
    unique = len(set(vals))
    nums = []
    for v in vals:
        v = v.strip()
        if v == "":
            continue
        try:
            nums.append(float(v))
        except ValueError:
            pass

    if len(nums) >= len(vals) * 0.7 and len(nums) > 0:
        return {
            "name": name, "type": "numeric",
            "missing": missing, "unique": unique,
            "min": f"{min(nums):.4g}", "max": f"{max(nums):.4g}",
            "mean": f"{statistics.mean(nums):.4g}",
            "median": f"{statistics.median(nums):.4g}",
        }
    return {"name": name, "type": "text", "missing": missing, "unique": unique}

_preview = [[r.get(h, "") for h in _headers] for r in _rows[:8]]
_stats = [_analyze_col(h) for h in _headers]

json.dumps({
    "rows": len(_rows),
    "cols": len(_headers),
    "headers": list(_headers),
    "preview": _preview,
    "stats": _stats,
})
`;

export default function Client() {
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<CsvResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const pyRef = useRef<PyodideInterface | null>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setResult(null);
    setFileName(file.name);

    try {
      if (!pyRef.current) {
        pyRef.current = await getPyodide(setStatus);
        setStatus("");
      }
      const text = await file.text();
      pyRef.current.globals.set("_csv_text", text);
      const raw = (await pyRef.current.runPythonAsync(ANALYSIS_CODE)) as string;
      setResult(JSON.parse(raw));
    } catch (e) {
      setResult({ rows: 0, cols: 0, headers: [], preview: [], stats: [], error: String(e) });
    } finally {
      setLoading(false);
      setStatus("");
    }
  }

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">📊</span>
          <h1 className="text-2xl sm:text-3xl font-black">CSV Analyzer</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400">
          Upload a CSV file and instantly get row/column stats, data types, missing values, and a data preview — powered by{" "}
          <span className="font-semibold text-green-600 dark:text-green-400">Python (Pyodide WASM)</span>.
        </p>
      </div>

      {/* Upload */}
      <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-10 cursor-pointer hover:border-green-400 dark:hover:border-green-600 transition-colors bg-slate-50 dark:bg-slate-900/50">
        <span className="text-4xl">📂</span>
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          Click or drop a CSV file here
        </span>
        <span className="text-xs text-slate-400">Processed entirely in your browser</span>
        <input
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </label>

      {/* Status */}
      {(loading || status) && (
        <p className="mt-4 text-sm text-blue-500 dark:text-blue-400 flex items-center gap-2">
          <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          {status || `Analyzing ${fileName}…`}
        </p>
      )}

      {/* Error */}
      {result?.error && (
        <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
          <p className="text-sm font-semibold text-red-600 dark:text-red-400">Error</p>
          <pre className="mt-1 text-xs text-red-500 whitespace-pre-wrap">{result.error}</pre>
        </div>
      )}

      {/* Results */}
      {result && !result.error && (
        <div className="mt-6 space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Rows", value: result.rows.toLocaleString() },
              { label: "Columns", value: result.cols.toLocaleString() },
              { label: "Numeric cols", value: result.stats.filter((s) => s.type === "numeric").length },
              { label: "Text cols", value: result.stats.filter((s) => s.type === "text").length },
            ].map((c) => (
              <div key={c.label} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 text-center">
                <p className="text-2xl font-black text-green-600 dark:text-green-400">{c.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{c.label}</p>
              </div>
            ))}
          </div>

          {/* Column statistics */}
          <div>
            <h2 className="text-base font-bold mb-3">Column Statistics</h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    {["Column", "Type", "Unique", "Missing", "Min", "Max", "Mean", "Median"].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.stats.map((col, i) => (
                    <tr key={col.name} className={i % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"}>
                      <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200 max-w-[160px] truncate" title={col.name}>
                        {col.name}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${col.type === "numeric" ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400" : "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400"}`}>
                          {col.type}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{col.unique}</td>
                      <td className="px-3 py-2">
                        <span className={col.missing > 0 ? "text-amber-600 dark:text-amber-400 font-semibold" : "text-slate-400"}>
                          {col.missing}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-500 font-mono text-xs">{col.min ?? "—"}</td>
                      <td className="px-3 py-2 text-slate-500 font-mono text-xs">{col.max ?? "—"}</td>
                      <td className="px-3 py-2 text-slate-500 font-mono text-xs">{col.mean ?? "—"}</td>
                      <td className="px-3 py-2 text-slate-500 font-mono text-xs">{col.median ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Data preview */}
          {result.preview.length > 0 && (
            <div>
              <h2 className="text-base font-bold mb-3">Data Preview (first 8 rows)</h2>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                      <th className="px-3 py-2 text-left text-slate-400 font-semibold">#</th>
                      {result.headers.map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-slate-600 dark:text-slate-300 font-semibold max-w-[120px]">
                          <span className="truncate block" title={h}>{h}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.preview.map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"}>
                        <td className="px-3 py-1.5 text-slate-400">{i + 1}</td>
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-1.5 text-slate-700 dark:text-slate-300 max-w-[120px]">
                            <span className="truncate block" title={cell}>{cell || <span className="text-slate-300 dark:text-slate-600 italic">—</span>}</span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <p className="mt-8 text-xs text-slate-400 dark:text-slate-500">
        ⚡ Powered by{" "}
        <a href="https://pyodide.org" target="_blank" rel="noopener noreferrer" className="underline">Pyodide</a>{" "}
        — Python stdlib csv &amp; statistics modules. File never leaves your device.
      </p>
    </main>
  );
}
