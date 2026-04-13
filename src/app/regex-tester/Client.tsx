"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { getPyodide } from "@/lib/pyodide-utils";
import type { PyodideInterface } from "@/lib/pyodide-utils";

interface Match {
  start: number;
  end: number;
  match: string;
  groups: string[];
  groupdict: Record<string, string>;
}

interface RegexResult {
  matches: Match[];
  error?: string;
}

const EXAMPLES = [
  { label: "Email", pattern: r`[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}`, flags: "", text: "Contact us at hello@freetools.lk or support@kdj.lk for help." },
  { label: "URL", pattern: r`https?://[^\s]+`, flags: "", text: "Visit https://freetools.lk and https://kdj.lk for more info." },
  { label: "Date", pattern: r`\d{4}-\d{2}-\d{2}`, flags: "", text: "Events on 2024-01-15, 2024-06-30 and 2025-12-25." },
  { label: "Words (groups)", pattern: r`(\w+)\s(\w+)`, flags: "", text: "Hello World Foo Bar Baz Qux" },
  { label: "Case insensitive", pattern: r`python`, flags: "i", text: "Python is great, PYTHON is powerful, python is fun." },
  { label: "Named groups", pattern: r`(?P<year>\d{4})-(?P<month>\d{2})-(?P<day>\d{2})`, flags: "", text: "Date: 2024-07-20 and 2025-01-01" },
];

// raw string helper (to keep backslashes)
function r(strings: TemplateStringsArray): string {
  return strings.raw[0];
}

const REGEX_CODE = `
import re, json

_flag_map = {"i": re.IGNORECASE, "m": re.MULTILINE, "s": re.DOTALL, "x": re.VERBOSE}
_flags = 0
for _f in _flags_str:
    _flags |= _flag_map.get(_f, 0)

_result = []
try:
    _pat = re.compile(_pattern, _flags)
    for _m in _pat.finditer(_text):
        _result.append({
            "start": _m.start(),
            "end": _m.end(),
            "match": _m.group(0),
            "groups": list(_m.groups() or []),
            "groupdict": dict(_m.groupdict()),
        })
    json.dumps({"matches": _result})
except re.error as _e:
    json.dumps({"matches": [], "error": str(_e)})
`;

/** Render the test text with match spans highlighted. */
function HighlightedText({ text, matches }: { text: string; matches: Match[] }) {
  if (!matches.length) {
    return (
      <pre className="whitespace-pre-wrap break-all font-mono text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        {text}
      </pre>
    );
  }

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  matches.forEach((m, idx) => {
    if (m.start > cursor) parts.push(<span key={`t${idx}`}>{text.slice(cursor, m.start)}</span>);
    parts.push(
      <mark
        key={`m${idx}`}
        className="bg-yellow-200 dark:bg-yellow-700/60 text-slate-900 dark:text-yellow-100 rounded px-0.5"
        title={`Match ${idx + 1}: "${m.match}"`}
      >
        {m.match}
      </mark>
    );
    cursor = m.end;
  });
  if (cursor < text.length) parts.push(<span key="tail">{text.slice(cursor)}</span>);

  return (
    <pre className="whitespace-pre-wrap break-all font-mono text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
      {parts}
    </pre>
  );
}

export default function Client() {
  const [pattern, setPattern] = useState(EXAMPLES[0].pattern);
  const [testText, setTestText] = useState(EXAMPLES[0].text);
  const [flags, setFlags] = useState<Record<string, boolean>>({ i: false, m: false, s: false, x: false });
  const [result, setResult] = useState<RegexResult | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const pyRef = useRef<PyodideInterface | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runRegex = useCallback(async (pat: string, txt: string, fls: Record<string, boolean>) => {
    if (!pat.trim()) { setResult(null); return; }

    try {
      if (!pyRef.current) {
        setLoading(true);
        pyRef.current = await getPyodide(setStatus);
        setStatus("");
        setLoading(false);
      }
      const flagStr = Object.entries(fls).filter(([, v]) => v).map(([k]) => k).join("");
      pyRef.current.globals.set("_pattern", pat);
      pyRef.current.globals.set("_text", txt);
      pyRef.current.globals.set("_flags_str", flagStr);
      const raw = (await pyRef.current.runPythonAsync(REGEX_CODE)) as string;
      setResult(JSON.parse(raw));
    } catch (e) {
      setResult({ matches: [], error: String(e) });
    }
  }, []);

  // Debounced auto-run on input change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runRegex(pattern, testText, flags), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [pattern, testText, flags, runRegex]);

  const toggleFlag = (f: string) => setFlags((prev) => ({ ...prev, [f]: !prev[f] }));

  const loadExample = (ex: typeof EXAMPLES[0]) => {
    setPattern(ex.pattern);
    setTestText(ex.text);
    setFlags({ i: ex.flags.includes("i"), m: ex.flags.includes("m"), s: ex.flags.includes("s"), x: ex.flags.includes("x") });
  };

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🔎</span>
          <h1 className="text-2xl sm:text-3xl font-black">Python Regex Tester</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400">
          Test Python{" "}
          <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">re</code>{" "}
          patterns with live highlighting, groups and flags — runs entirely in your browser.
        </p>
      </div>

      {/* Example buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            type="button"
            onClick={() => loadExample(ex)}
            className="text-xs px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-green-100 dark:hover:bg-green-900/40 text-slate-600 dark:text-slate-300 font-medium transition-colors"
          >
            {ex.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {/* Pattern input + flags */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Pattern</label>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="\d{4}-\d{2}-\d{2}"
              spellCheck={false}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 font-mono text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Flags</label>
            <div className="flex gap-2">
              {["i", "m", "s", "x"].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleFlag(f)}
                  title={{ i: "IGNORECASE", m: "MULTILINE", s: "DOTALL", x: "VERBOSE" }[f]}
                  className={`w-9 h-9 rounded-lg text-sm font-bold border transition-colors ${
                    flags[f]
                      ? "bg-green-600 border-green-600 text-white"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-green-400"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Test text */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Test String</label>
          <textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            rows={5}
            placeholder="Enter text to test your pattern against…"
            spellCheck={false}
            className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Status */}
      {(loading || status) && (
        <p className="mt-3 text-sm text-blue-500 flex items-center gap-2">
          <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          {status || "Running…"}
        </p>
      )}

      {/* Error */}
      {result?.error && (
        <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400 font-mono">{result.error}</p>
        </div>
      )}

      {/* Results */}
      {result && !result.error && (
        <div className="mt-5 space-y-4">
          {/* Match count badge */}
          <div className="flex items-center gap-3">
            <span
              className={`text-sm font-bold px-3 py-1 rounded-full ${
                result.matches.length > 0
                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                  : "bg-slate-100 text-slate-500 dark:bg-slate-800"
              }`}
            >
              {result.matches.length} {result.matches.length === 1 ? "match" : "matches"}
            </span>
          </div>

          {/* Highlighted preview */}
          {testText && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Highlighted Text</p>
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-900">
                <HighlightedText text={testText} matches={result.matches} />
              </div>
            </div>
          )}

          {/* Match detail table */}
          {result.matches.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Match Details</p>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                      {["#", "Match", "Start", "End", "Groups", "Named Groups"].map((h) => (
                        <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.matches.map((m, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"}>
                        <td className="px-3 py-2 text-slate-400 font-mono text-xs">{i + 1}</td>
                        <td className="px-3 py-2 font-mono text-xs font-semibold text-green-700 dark:text-green-400">
                          <span className="bg-yellow-100 dark:bg-yellow-800/30 px-1.5 py-0.5 rounded">{m.match}</span>
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-slate-500">{m.start}</td>
                        <td className="px-3 py-2 font-mono text-xs text-slate-500">{m.end}</td>
                        <td className="px-3 py-2 font-mono text-xs text-slate-500">
                          {m.groups.length > 0 ? m.groups.map((g, gi) => <span key={gi} className="mr-1 bg-slate-100 dark:bg-slate-700 px-1 rounded">{g}</span>) : "—"}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-slate-500">
                          {Object.keys(m.groupdict).length > 0
                            ? Object.entries(m.groupdict).map(([k, v]) => (
                                <span key={k} className="mr-1"><span className="text-blue-500">{k}</span>=<span className="bg-slate-100 dark:bg-slate-700 px-1 rounded">{v}</span></span>
                              ))
                            : "—"}
                        </td>
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
        ⚡ Uses Python&apos;s{" "}
        <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">re</code> module.
        Results match Python behavior exactly. Runs entirely in your browser.
      </p>
    </main>
  );
}
