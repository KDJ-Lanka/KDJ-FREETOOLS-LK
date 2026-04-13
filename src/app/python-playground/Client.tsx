"use client";
import { useState, useRef } from "react";
import { getPyodide, runPythonSafe } from "@/lib/pyodide-utils";
import type { PyodideInterface } from "@/lib/pyodide-utils";

const EXAMPLES: { label: string; code: string }[] = [
  {
    label: "Hello World",
    code: `print("Hello from Python in the browser! 🐍")
print("All processing happens locally on your device")`,
  },
  {
    label: "Fibonacci",
    code: `def fib(n):
    a, b = 0, 1
    for _ in range(n):
        print(a, end=" ")
        a, b = b, a + b

fib(15)
print()`,
  },
  {
    label: "List comprehension",
    code: `squares = [x**2 for x in range(1, 11)]
evens  = [x for x in range(20) if x % 2 == 0]

print("Squares:", squares)
print("Evens:  ", evens)`,
  },
  {
    label: "String manipulation",
    code: `text = "FreeTools.lk — free tools for everyone"
words = text.split()

print(f"Word count: {len(words)}")
print(f"Uppercase: {text.upper()}")
print(f"Reversed words: {' '.join(reversed(words))}")`,
  },
  {
    label: "Prime numbers",
    code: `def is_prime(n):
    if n < 2: return False
    return all(n % i != 0 for i in range(2, int(n**0.5) + 1))

primes = [n for n in range(2, 60) if is_prime(n)]
print(f"Primes up to 60 ({len(primes)} total):")
print(primes)`,
  },
  {
    label: "hashlib demo",
    code: `import hashlib

text = "Hello, FreeTools.lk!"
for algo in ["md5", "sha1", "sha256"]:
    h = hashlib.new(algo, text.encode()).hexdigest()
    print(f"{algo:8s}: {h}")`,
  },
];

export default function Client() {
  const [code, setCode] = useState(EXAMPLES[0].code);
  const [stdout, setStdout] = useState("");
  const [stderr, setStderr] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [running, setRunning] = useState(false);
  const pyRef = useRef<PyodideInterface | null>(null);

  async function run() {
    if (running) return;
    setRunning(true);
    setStdout("");
    setStderr("");
    setError(null);

    try {
      if (!pyRef.current) {
        pyRef.current = await getPyodide(setStatus);
        setStatus("");
      }
      const result = await runPythonSafe(pyRef.current, code);
      setStdout(result.stdout);
      setStderr(result.stderr);
      setError(result.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
      setStatus("");
    }
  }

  const hasOutput = stdout || stderr || error;

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🐍</span>
          <h1 className="text-2xl sm:text-3xl font-black">Python Playground</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400">
          Run Python code directly in your browser — no server, no install, 100% private.
        </p>
      </div>

      {/* Example buttons */}
      <div className="flex flex-wrap gap-2 mb-3">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            type="button"
            onClick={() => { setCode(ex.code); setStdout(""); setStderr(""); setError(null); }}
            className="text-xs px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-green-100 dark:hover:bg-green-900/40 text-slate-600 dark:text-slate-300 font-medium transition-colors"
          >
            {ex.label}
          </button>
        ))}
      </div>

      {/* Editor */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950">
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-700">
          <span className="text-xs text-slate-400 font-mono">main.py</span>
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/70" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <span className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            // Tab inserts 4 spaces
            if (e.key === "Tab") {
              e.preventDefault();
              const s = e.currentTarget.selectionStart;
              const end = e.currentTarget.selectionEnd;
              const newCode = code.substring(0, s) + "    " + code.substring(end);
              setCode(newCode);
              requestAnimationFrame(() => {
                e.currentTarget.selectionStart = e.currentTarget.selectionEnd = s + 4;
              });
            }
            // Ctrl/Cmd+Enter runs code
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") run();
          }}
          rows={18}
          spellCheck={false}
          className="w-full bg-slate-950 text-green-300 font-mono text-sm p-4 resize-y focus:outline-none leading-relaxed"
          placeholder="# Write your Python code here…"
        />
      </div>

      {/* Run button */}
      <div className="flex items-center gap-3 mt-3">
        <button
          onClick={run}
          disabled={running}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
        >
          {running ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Running…
            </>
          ) : (
            <>▶ Run (Ctrl+Enter)</>
          )}
        </button>
        <button
          type="button"
          onClick={() => { setCode(""); setStdout(""); setStderr(""); setError(null); }}
          className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Status */}
      {status && (
        <p className="mt-3 text-sm text-blue-500 dark:text-blue-400 flex items-center gap-2">
          <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          {status}
        </p>
      )}

      {/* Output */}
      {hasOutput && (
        <div className="mt-5 space-y-3">
          {stdout && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Output</span>
                <button
                  onClick={() => navigator.clipboard.writeText(stdout)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Copy
                </button>
              </div>
              <pre className="bg-slate-900 text-green-300 rounded-xl p-4 text-sm font-mono whitespace-pre-wrap overflow-x-auto leading-relaxed">
                {stdout}
              </pre>
            </div>
          )}
          {stderr && (
            <div>
              <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Stderr</span>
              <pre className="mt-1 bg-amber-950/30 text-amber-400 rounded-xl p-4 text-sm font-mono whitespace-pre-wrap overflow-x-auto leading-relaxed border border-amber-800/40">
                {stderr}
              </pre>
            </div>
          )}
          {error && (
            <div>
              <span className="text-xs font-semibold text-red-500 uppercase tracking-wide">Error</span>
              <pre className="mt-1 bg-red-950/30 text-red-400 rounded-xl p-4 text-sm font-mono whitespace-pre-wrap overflow-x-auto leading-relaxed border border-red-800/40">
                {error}
              </pre>
            </div>
          )}
        </div>
      )}

      <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">
        ⚡ Full Python standard library available. Runs entirely in your browser — no data is ever uploaded.
      </p>
    </main>
  );
}
