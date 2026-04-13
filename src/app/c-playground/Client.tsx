"use client";
import { useState, useCallback, useEffect, useRef } from "react";

declare global {
  interface Window {
    JSCPP: {
      run(
        code: string,
        input: string,
        config: {
          stdio?: { write?: (s: string) => void };
          maxTimeout?: number;
        }
      ): number;
    };
  }
}

const CDN = "https://cdn.jsdelivr.net/npm/JSCPP@2.1.2/dist/JSCPP.es5.min.js";

let jscppLoadPromise: Promise<void> | null = null;
function loadJSCPP(setStatus: (s: string) => void): Promise<void> {
  if (typeof window !== "undefined" && window.JSCPP) return Promise.resolve();
  if (jscppLoadPromise) return jscppLoadPromise;
  jscppLoadPromise = new Promise<void>((resolve, reject) => {
    setStatus("Loading C engine…");
    const s = document.createElement("script");
    s.src = CDN;
    s.onload = () => { setStatus(""); resolve(); };
    s.onerror = () => reject(new Error("Failed to load C engine. Check your connection."));
    document.head.appendChild(s);
  });
  return jscppLoadPromise;
}

const EXAMPLES = [
  {
    label: "Hello World",
    stdin: "",
    code: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    printf("Welcome to C programming!\\n");
    return 0;
}`,
  },
  {
    label: "Read Input",
    stdin: "7",
    code: `#include <stdio.h>

int main() {
    int n;
    scanf("%d", &n);
    printf("You entered: %d\\n", n);
    printf("Square : %d\\n", n * n);
    printf("Cube   : %d\\n", n * n * n);
    return 0;
}`,
  },
  {
    label: "Fibonacci",
    stdin: "",
    code: `#include <stdio.h>

int fib(int n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
}

int main() {
    int i;
    printf("Fibonacci sequence:\\n");
    for (i = 0; i < 10; i++) {
        printf("fib(%d) = %d\\n", i, fib(i));
    }
    return 0;
}`,
  },
  {
    label: "Bubble Sort",
    stdin: "",
    code: `#include <stdio.h>

int main() {
    int arr[] = {64, 34, 25, 12, 22, 11, 90};
    int n = 7, i, j, temp;

    for (i = 0; i < n - 1; i++) {
        for (j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }

    printf("Sorted array: ");
    for (i = 0; i < n; i++) {
        printf("%d ", arr[i]);
    }
    printf("\\n");
    return 0;
}`,
  },
  {
    label: "Struct",
    stdin: "",
    code: `#include <stdio.h>

struct Student {
    int id;
    int age;
    float gpa;
};

int main() {
    struct Student s1, s2;

    s1.id = 101;  s1.age = 20;  s1.gpa = 3.75f;
    s2.id = 102;  s2.age = 21;  s2.gpa = 3.50f;

    printf("ID  Age  GPA\\n");
    printf("%-4d %-4d %.2f\\n", s1.id, s1.age, s1.gpa);
    printf("%-4d %-4d %.2f\\n", s2.id, s2.age, s2.gpa);
    return 0;
}`,
  },
  {
    label: "Linked List",
    stdin: "",
    code: `#include <stdio.h>
#include <stdlib.h>

struct Node {
    int data;
    struct Node* next;
};

int main() {
    struct Node* head = NULL;
    struct Node* n1 = (struct Node*)malloc(sizeof(struct Node));
    struct Node* n2 = (struct Node*)malloc(sizeof(struct Node));
    struct Node* n3 = (struct Node*)malloc(sizeof(struct Node));

    n1->data = 10; n1->next = n2;
    n2->data = 20; n2->next = n3;
    n3->data = 30; n3->next = NULL;
    head = n1;

    struct Node* cur = head;
    printf("List: ");
    while (cur != NULL) {
        printf("%d -> ", cur->data);
        cur = cur->next;
    }
    printf("NULL\\n");

    free(n1); free(n2); free(n3);
    return 0;
}`,
  },
];

export default function Client() {
  const [code, setCode] = useState(EXAMPLES[0].code);
  const [stdin, setStdin] = useState(EXAMPLES[0].stdin);
  const [output, setOutput] = useState("");
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [running, setRunning] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      loadJSCPP(setStatus).catch((e) => setStatus(String(e)));
    }
  }, []);

  const run = useCallback(async () => {
    setRunning(true);
    setOutput("");
    setError(null);
    setExitCode(null);
    try {
      await loadJSCPP(setStatus);
      let out = "";
      const config = {
        stdio: { write: (s: string) => { out += s; } },
        maxTimeout: 10000,
      };
      const ec = window.JSCPP.run(code, stdin, config);
      setOutput(out || "(no output)");
      setExitCode(ec);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  }, [code, stdin]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); run(); }
    if (e.key === "Tab") {
      e.preventDefault();
      const s = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      setCode(code.substring(0, s) + "    " + code.substring(end));
      requestAnimationFrame(() => { e.currentTarget.selectionStart = e.currentTarget.selectionEnd = s + 4; });
    }
  };

  return (
    <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 gap-5">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">⚙️</span>
          <h1 className="text-2xl sm:text-3xl font-black">C / C++ Playground</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Write and run C/C++ code right in your browser — no installation needed.
        </p>
      </div>

      {/* Examples */}
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            type="button"
            onClick={() => { setCode(ex.code); setStdin(ex.stdin); setOutput(""); setError(null); setExitCode(null); }}
            className="text-xs px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
          >
            {ex.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-5 flex-1">
        {/* Editor */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-700 shrink-0">
              <span className="text-xs text-slate-400 font-mono">main.c</span>
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/70" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <span className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={20}
              spellCheck={false}
              className="w-full bg-slate-950 text-green-300 font-mono text-sm p-4 resize-y focus:outline-none leading-relaxed"
              placeholder="// Write your C code here…"
            />
          </div>

          {/* Stdin */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Standard Input (stdin) — used by scanf
            </label>
            <input
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="e.g. 5  or  3 7  (space-separated for multiple values)"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700"
            />
          </div>

          {/* Run */}
          <div className="flex items-center gap-3">
            <button
              onClick={run}
              disabled={running || !!status}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
            >
              {running ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : "▶"}
              {running ? "Running…" : "Run"}
              <span className="text-[10px] opacity-70 hidden sm:inline">Ctrl+Enter</span>
            </button>
            <button
              type="button"
              onClick={() => { setCode(""); setOutput(""); setError(null); setExitCode(null); }}
              className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              Clear
            </button>
            {status && (
              <span className="text-sm text-blue-500 flex items-center gap-1">
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                {status}
              </span>
            )}
          </div>

          {/* Output */}
          <div className="rounded-2xl border border-slate-700 bg-slate-950 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-700">
              <span className="text-xs text-slate-400 font-mono">output</span>
              {exitCode !== null && (
                <span className={`text-xs font-mono ${exitCode === 0 ? "text-green-400" : "text-red-400"}`}>
                  exit {exitCode}
                </span>
              )}
            </div>
            <pre className="text-sm font-mono p-4 text-slate-200 min-h-[120px] whitespace-pre-wrap">
              {error ? <span className="text-red-400">{error}</span> : output || <span className="text-slate-600">Output will appear here…</span>}
            </pre>
          </div>
        </div>

        {/* Tips panel */}
        <div className="lg:w-64 xl:w-72 shrink-0 space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Supported Features</h2>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              {["stdio.h (printf, scanf)", "math.h (pow, sqrt, …)", "string.h (strlen, strcmp, …)", "stdlib.h (malloc, free, atoi)", "Arrays & pointers", "Structs & typedef", "Functions & recursion", "for / while / do-while", "Basic C++ iostream"].map(f => (
                <li key={f} className="flex gap-1.5"><span className="text-green-500 shrink-0">✓</span>{f}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 p-4">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-2">💡 Tips</p>
            <ul className="space-y-1.5 text-xs text-amber-800 dark:text-amber-300">
              <li>• <strong>Ctrl+Enter</strong> to run</li>
              <li>• <strong>Tab</strong> inserts 4 spaces</li>
              <li>• For <strong>scanf</strong>, put input values in the stdin box above</li>
              <li>• Use examples above to explore common programs</li>
              <li>• No file I/O or graphics (terminal only)</li>
            </ul>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500">
        ⚡ C/C++ interpreted locally in your browser — all code stays on your device.
      </p>
    </main>
  );
}
