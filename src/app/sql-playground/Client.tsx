"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import {
  getSqlJs, DB_SEED, DB_EXAMPLES, DB_META,
  type DbName, type SqlDatabase, type ExampleQuery,
} from "@/lib/sql-utils";

// ── Types ────────────────────────────────────────────────────────────────
interface ResultSet {
  columns: string[];
  rows: unknown[][];
}

interface SchemaColumn { name: string; type: string }
interface SchemaTable  { name: string; columns: SchemaColumn[] }

// ── Helpers ───────────────────────────────────────────────────────────────
function cellStr(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  return String(v);
}

function groupBy<T>(arr: T[], key: (x: T) => string): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, x) => {
    const k = key(x);
    (acc[k] ??= []).push(x);
    return acc;
  }, {});
}

// ── Sub-components ───────────────────────────────────────────────────────
function ResultTable({ result }: { result: ResultSet }) {
  const MAX_ROWS = 500;
  const rows = result.rows.slice(0, MAX_ROWS);
  if (!rows.length) {
    return <p className="text-sm text-slate-400 italic mt-2">No rows returned.</p>;
  }
  return (
    <div className="overflow-auto max-h-72 rounded-xl border border-slate-200 dark:border-slate-700 mt-3">
      <table className="min-w-full text-xs">
        <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800">
          <tr>
            {result.columns.map((c) => (
              <th key={c} className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"}>
              {(row as unknown[]).map((cell, j) => {
                const s = cellStr(cell);
                const isNull = s === "NULL";
                return (
                  <td key={j} className={`px-3 py-1.5 whitespace-nowrap font-mono ${isNull ? "text-slate-300 dark:text-slate-600 italic" : "text-slate-700 dark:text-slate-300"}`}>
                    {s}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {result.rows.length > MAX_ROWS && (
        <p className="text-xs text-center text-slate-400 p-2">
          Showing first {MAX_ROWS} of {result.rows.length} rows.
        </p>
      )}
    </div>
  );
}

function SchemaPanel({ schema, expandedTables, onToggle }: {
  schema: SchemaTable[];
  expandedTables: Set<string>;
  onToggle: (t: string) => void;
}) {
  if (!schema.length) return <p className="text-xs text-slate-400 italic">No tables yet.</p>;
  return (
    <div className="space-y-1">
      {schema.map((t) => {
        const open = expandedTables.has(t.name);
        return (
          <div key={t.name}>
            <button
              type="button"
              onClick={() => onToggle(t.name)}
              className="flex items-center gap-1.5 w-full text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-1"
            >
              <span className="shrink-0">{open ? "▾" : "▸"}</span>
              <span className="font-mono">{t.name}</span>
              <span className="text-slate-400 font-normal">({t.columns.length})</span>
            </button>
            {open && (
              <div className="ml-4 space-y-0.5 mb-1">
                {t.columns.map((c) => (
                  <p key={c.name} className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex gap-2">
                    <span>{c.name}</span>
                    <span className="text-slate-300 dark:text-slate-600">{c.type}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────
export default function Client() {
  const [dbName, setDbName]         = useState<DbName>("students");
  const [query, setQuery]           = useState(DB_EXAMPLES.students[0].sql);
  const [results, setResults]       = useState<ResultSet[]>([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError]           = useState<string | null>(null);
  const [status, setStatus]         = useState("");
  const [schema, setSchema]         = useState<SchemaTable[]>([]);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [history, setHistory]       = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [activeExCat, setActiveExCat] = useState("Basics");

  const dbRef = useRef<SqlDatabase | null>(null);

  // ── Build schema from sqlite_master ──────────────────────────────────
  const buildSchema = useCallback((db: SqlDatabase) => {
    const tables = db.exec(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
    )[0]?.values?.map((r) => String(r[0])) ?? [];

    const s: SchemaTable[] = tables.map((tbl) => {
      const info = db.exec(`PRAGMA table_info("${tbl}");`)[0];
      const cols: SchemaColumn[] = (info?.values ?? []).map((r) => ({
        name: String(r[1]),
        type: String(r[2] || ""),
      }));
      return { name: tbl, columns: cols };
    });

    setSchema(s);
    setExpandedTables(new Set(s.map((t) => t.name)));
  }, []);

  // ── Initialize (or re-initialize) a database ─────────────────────────
  const initDb = useCallback(async (name: DbName) => {
    setStatus("Loading SQL engine…");
    setResults([]);
    setError(null);
    setSuccessMsg("");
    setSchema([]);
    setHistory([]);

    try {
      const SQL = await getSqlJs(setStatus);
      const db  = new SQL.Database();
      db.run(DB_SEED[name]);
      dbRef.current = db;
      buildSchema(db);
      setStatus("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("");
    }
  }, [buildSchema]);

  // Load first DB on mount
  useEffect(() => {
    initDb(dbName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch database
  const switchDb = useCallback((name: DbName) => {
    setDbName(name);
    setQuery(DB_EXAMPLES[name][0].sql);
    setActiveExCat("Basics");
    initDb(name);
  }, [initDb]);

  // ── Run query ────────────────────────────────────────────────────────
  const runQuery = useCallback(() => {
    const db = dbRef.current;
    if (!db || !query.trim()) return;

    setError(null);
    setSuccessMsg("");
    setResults([]);

    try {
      const raw = db.exec(query);
      if (raw.length === 0) {
        // Non-SELECT (INSERT/UPDATE/DELETE/CREATE/…)
        setSuccessMsg("Query executed successfully.");
        buildSchema(db); // schema may have changed
      } else {
        setResults(raw.map((r) => ({ columns: r.columns, rows: r.values })));
      }
      setHistory((prev) => {
        const h = [query, ...prev.filter((q) => q !== query)].slice(0, 20);
        return h;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [query, buildSchema]);

  // Ctrl/Cmd + Enter to run
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      runQuery();
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const s = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const next = query.substring(0, s) + "  " + query.substring(end);
      setQuery(next);
      requestAnimationFrame(() => {
        e.currentTarget.selectionStart = e.currentTarget.selectionEnd = s + 2;
      });
    }
  }, [query, runQuery]);

  // ── Example query categories ─────────────────────────────────────────
  const examples  = DB_EXAMPLES[dbName];
  const exByGroup = groupBy(examples, (e) => e.category);
  const exCats    = Object.keys(exByGroup);

  const toggleTable = (t: string) =>
    setExpandedTables((prev) => {
      const s = new Set(prev);
      s.has(t) ? s.delete(t) : s.add(t);
      return s;
    });

  const loadingDb = !!status;

  return (
    <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 gap-5">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">🗄️</span>
          <h1 className="text-2xl sm:text-3xl font-black">SQL Playground</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Practice SQL with real sample data — runs entirely in your browser, nothing uploaded.
        </p>
      </div>

      {/* ── Database selector ──────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(DB_META) as DbName[]).map((name) => {
          const m = DB_META[name];
          return (
            <button
              key={name}
              type="button"
              onClick={() => switchDb(name)}
              disabled={loadingDb}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                dbName === name
                  ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-600"
              }`}
            >
              <span>{m.icon}</span>
              <span>{m.label}</span>
              {dbName === name && (
                <span className="text-[10px] font-normal opacity-80 hidden sm:inline">{m.description}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Main two-column layout ────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-5 flex-1">

        {/* Left: editor + results */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">

          {/* Editor */}
          <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-700">
              <span className="text-xs text-slate-400 font-mono">query.sql</span>
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/70" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <span className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
            </div>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={10}
              spellCheck={false}
              disabled={loadingDb}
              placeholder="-- Write your SQL here…"
              className="w-full bg-slate-950 text-green-300 font-mono text-sm p-4 resize-y focus:outline-none leading-relaxed disabled:opacity-50"
            />
          </div>

          {/* Run button row */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={runQuery}
              disabled={loadingDb || !dbRef.current}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
            >
              ▶ Run Query
              <span className="text-[10px] opacity-70 hidden sm:inline">Ctrl+Enter</span>
            </button>
            <button
              type="button"
              onClick={() => { setQuery(""); setResults([]); setError(null); setSuccessMsg(""); }}
              className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              Clear
            </button>
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => setShowHistory((v) => !v)}
                className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors ml-auto"
              >
                {showHistory ? "Hide" : "Show"} history ({history.length})
              </button>
            )}
          </div>

          {/* History */}
          {showHistory && history.length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
              {history.map((h, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { setQuery(h); setShowHistory(false); }}
                  className="block w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <p className="font-mono text-xs text-slate-600 dark:text-slate-300 truncate">{h.replace(/\s+/g, " ")}</p>
                </button>
              ))}
            </div>
          )}

          {/* Status / loading */}
          {status && (
            <p className="text-sm text-blue-500 flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              {status}
            </p>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
              <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-1">Error</p>
              <pre className="text-sm text-red-600 dark:text-red-400 font-mono whitespace-pre-wrap">{error}</pre>
            </div>
          )}

          {/* Success message */}
          {successMsg && !results.length && (
            <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
              <span>✓</span>{successMsg}
            </p>
          )}

          {/* Results */}
          {results.map((r, i) => (
            <div key={i}>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Result set {results.length > 1 ? i + 1 : ""}
                </span>
                <span className="text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-semibold">
                  {r.rows.length} {r.rows.length === 1 ? "row" : "rows"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const csv = [r.columns.join(","), ...r.rows.map((row) => (row as unknown[]).map(cellStr).join(","))].join("\n");
                    navigator.clipboard.writeText(csv);
                  }}
                  className="ml-auto text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Copy CSV
                </button>
              </div>
              <ResultTable result={r} />
            </div>
          ))}
        </div>

        {/* Right: schema + examples */}
        <div className="lg:w-72 xl:w-80 flex flex-col gap-5 shrink-0">

          {/* Schema */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Schema</h2>
            <SchemaPanel schema={schema} expandedTables={expandedTables} onToggle={toggleTable} />
          </div>

          {/* Example queries */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Example Queries</h2>

            {/* Category tabs */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {exCats.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveExCat(cat)}
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${
                    activeExCat === cat
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Query list */}
            <div className="space-y-1">
              {(exByGroup[activeExCat] ?? []).map((ex: ExampleQuery, i: number) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setQuery(ex.sql)}
                  className="block w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-400 transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 p-4">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-2">💡 Tips</p>
            <ul className="space-y-1.5 text-xs text-amber-800 dark:text-amber-300">
              <li>• <strong>Ctrl+Enter</strong> runs the query</li>
              <li>• <strong>Tab</strong> inserts 2 spaces</li>
              <li>• You can <strong>CREATE TABLE</strong> and insert your own data</li>
              <li>• <strong>NULL</strong> values are shown in grey</li>
              <li>• Click any example to load it into the editor</li>
              <li>• <strong>Copy CSV</strong> copies results to clipboard</li>
            </ul>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500">
        ⚡ Uses SQLite running locally in your browser — all data stays on your device.
      </p>
    </main>
  );
}
