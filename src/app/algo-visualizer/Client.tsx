"use client";
import { useState, useEffect, useRef, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────────────────
interface SortStep {
  array: number[];
  comparing: number[];
  swapping: number[];
  sorted: number[];
  description: string;
}

type Algorithm = "bubble" | "selection" | "insertion";
type Speed = "slow" | "medium" | "fast";

const SPEED_MS: Record<Speed, number> = { slow: 700, medium: 280, fast: 80 };

// ── Step generators ───────────────────────────────────────────────────────
function bubbleSortSteps(arr: number[]): SortStep[] {
  const steps: SortStep[] = [];
  const a = [...arr];
  const n = a.length;
  const sortedSet = new Set<number>();

  steps.push({ array: [...a], comparing: [], swapping: [], sorted: [], description: "Start: scan pairs from left, bubble largest to end." });

  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      steps.push({ array: [...a], comparing: [j, j + 1], swapping: [], sorted: [...sortedSet], description: `Compare a[${j}]=${a[j]} and a[${j+1}]=${a[j+1]}` });
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swapped = true;
        steps.push({ array: [...a], comparing: [], swapping: [j, j + 1], sorted: [...sortedSet], description: `Swap → a[${j}]=${a[j]}, a[${j+1}]=${a[j+1]}` });
      }
    }
    sortedSet.add(n - 1 - i);
    if (!swapped) break;
  }
  for (let i = 0; i < n; i++) sortedSet.add(i);
  steps.push({ array: [...a], comparing: [], swapping: [], sorted: [...sortedSet], description: "✓ Array is fully sorted!" });
  return steps;
}

function selectionSortSteps(arr: number[]): SortStep[] {
  const steps: SortStep[] = [];
  const a = [...arr];
  const n = a.length;
  const sortedSet = new Set<number>();

  steps.push({ array: [...a], comparing: [], swapping: [], sorted: [], description: "Start: repeatedly find the minimum and move it to the front." });

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    steps.push({ array: [...a], comparing: [minIdx], swapping: [], sorted: [...sortedSet], description: `Pass ${i+1}: looking for minimum in a[${i}…${n-1}]` });

    for (let j = i + 1; j < n; j++) {
      steps.push({ array: [...a], comparing: [minIdx, j], swapping: [], sorted: [...sortedSet], description: `Compare a[${j}]=${a[j]} with current min a[${minIdx}]=${a[minIdx]}` });
      if (a[j] < a[minIdx]) {
        minIdx = j;
        steps.push({ array: [...a], comparing: [minIdx], swapping: [], sorted: [...sortedSet], description: `New minimum: a[${minIdx}]=${a[minIdx]}` });
      }
    }
    if (minIdx !== i) {
      [a[i], a[minIdx]] = [a[minIdx], a[i]];
      steps.push({ array: [...a], comparing: [], swapping: [i, minIdx], sorted: [...sortedSet], description: `Swap a[${i}] ↔ a[${minIdx}]` });
    }
    sortedSet.add(i);
  }
  sortedSet.add(n - 1);
  steps.push({ array: [...a], comparing: [], swapping: [], sorted: [...sortedSet], description: "✓ Array is fully sorted!" });
  return steps;
}

function insertionSortSteps(arr: number[]): SortStep[] {
  const steps: SortStep[] = [];
  const a = [...arr];
  const n = a.length;

  steps.push({ array: [...a], comparing: [], swapping: [], sorted: [0], description: "a[0] is trivially sorted." });

  for (let i = 1; i < n; i++) {
    const key = a[i];
    let j = i - 1;
    const sortedSoFar = Array.from({ length: i }, (_, k) => k);

    steps.push({ array: [...a], comparing: [i], swapping: [], sorted: sortedSoFar, description: `Take key = a[${i}] = ${key}, insert into sorted a[0…${i-1}]` });

    while (j >= 0 && a[j] > key) {
      a[j + 1] = a[j];
      steps.push({ array: [...a], comparing: [], swapping: [j, j + 1], sorted: Array.from({ length: i }, (_, k) => k), description: `Shift a[${j}]=${a[j+1]} right to position ${j+1}` });
      j--;
    }
    a[j + 1] = key;
    steps.push({ array: [...a], comparing: [], swapping: [], sorted: Array.from({ length: i + 1 }, (_, k) => k), description: `Placed ${key} at index ${j+1}` });
  }

  steps.push({ array: [...a], comparing: [], swapping: [], sorted: Array.from({ length: n }, (_, i) => i), description: "✓ Array is fully sorted!" });
  return steps;
}

const GENERATORS: Record<Algorithm, (arr: number[]) => SortStep[]> = {
  bubble: bubbleSortSteps,
  selection: selectionSortSteps,
  insertion: insertionSortSteps,
};

const ALGO_INFO: Record<Algorithm, { label: string; worstCase: string; bestCase: string; space: string; description: string }> = {
  bubble: { label: "Bubble Sort", worstCase: "O(n²)", bestCase: "O(n)", space: "O(1)", description: "Repeatedly swap adjacent elements if out of order. Largest elements 'bubble' to the end each pass." },
  selection: { label: "Selection Sort", worstCase: "O(n²)", bestCase: "O(n²)", space: "O(1)", description: "Find the minimum in the unsorted portion and place it at the front. At most n-1 swaps." },
  insertion: { label: "Insertion Sort", worstCase: "O(n²)", bestCase: "O(n)", space: "O(1)", description: "Build a sorted portion left-to-right by inserting each new element into its correct position." },
};

function randomArray(size: number): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 95) + 5);
}

function getBarColor(i: number, step: SortStep): string {
  if (step.sorted.includes(i))    return "bg-green-500";
  if (step.swapping.includes(i))  return "bg-red-500";
  if (step.comparing.includes(i)) return "bg-yellow-400";
  return "bg-blue-500";
}

export default function Client() {
  const [algo, setAlgo]                 = useState<Algorithm>("bubble");
  const [size, setSize]                 = useState(18);
  const [speed, setSpeed]               = useState<Speed>("medium");
  const [steps, setSteps]               = useState<SortStep[]>([]);
  const [currentStep, setCurrentStep]   = useState(0);
  const [playing, setPlaying]           = useState(false);
  const [customInput, setCustomInput]   = useState("");
  const [customError, setCustomError]   = useState("");
  const [initialArr, setInitialArr]     = useState<number[]>(() => randomArray(18));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // cleanup on unmount
  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const visualize = useCallback((arr = initialArr) => {
    stopInterval();
    setPlaying(false);
    const s = GENERATORS[algo](arr);
    setSteps(s);
    setCurrentStep(0);
  }, [algo, initialArr, stopInterval]);

  // Re-visualize when algo changes (if steps exist)
  useEffect(() => {
    if (steps.length > 0) visualize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [algo]);

  const play = useCallback(() => {
    if (!steps.length) return;
    if (currentStep >= steps.length - 1) { setCurrentStep(0); }
    setPlaying(true);
    intervalRef.current = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= steps.length - 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, SPEED_MS[speed]);
  }, [steps, currentStep, speed]);

  const pause = useCallback(() => { stopInterval(); setPlaying(false); }, [stopInterval]);

  const step = useCallback((dir: 1 | -1) => {
    stopInterval(); setPlaying(false);
    setCurrentStep(prev => Math.max(0, Math.min(prev + dir, steps.length - 1)));
  }, [steps.length, stopInterval]);

  const newRandom = useCallback(() => {
    const arr = randomArray(size);
    setInitialArr(arr);
    stopInterval();
    setPlaying(false);
    setSteps([]);
    setCurrentStep(0);
  }, [size, stopInterval]);

  const applyCustom = () => {
    const nums = customInput.split(/[\s,]+/).map(Number);
    if (nums.some(n => isNaN(n) || n <= 0 || n > 500)) {
      setCustomError("Use positive numbers 1–500, comma or space separated.");
      return;
    }
    if (nums.length < 3 || nums.length > 30) {
      setCustomError("Enter between 3 and 30 numbers.");
      return;
    }
    setCustomError("");
    setInitialArr(nums);
    setSize(nums.length);
    stopInterval(); setPlaying(false); setSteps([]); setCurrentStep(0);
  };

  const cur = steps[currentStep];
  const maxVal = cur ? Math.max(...cur.array) : 100;
  const info = ALGO_INFO[algo];

  return (
    <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 gap-5">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">📊</span>
          <h1 className="text-2xl sm:text-3xl font-black">Algorithm Visualizer</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Watch sorting algorithms work step-by-step — comparisons, swaps, and sorted elements highlighted live.
        </p>
      </div>

      {/* Algorithm selector */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(ALGO_INFO) as Algorithm[]).map(a => (
          <button
            key={a}
            type="button"
            onClick={() => setAlgo(a)}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
              algo === a
                ? "bg-blue-600 border-blue-600 text-white"
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-blue-400"
            }`}
          >
            {ALGO_INFO[a].label}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 flex flex-wrap items-center gap-4">
        {/* Size */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Size: {size}</span>
          <input
            type="range" min={5} max={30} value={size}
            onChange={e => { const v = Number(e.target.value); setSize(v); setInitialArr(randomArray(v)); stopInterval(); setPlaying(false); setSteps([]); setCurrentStep(0); }}
            className="w-24 accent-blue-600"
          />
        </div>

        {/* Speed */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold text-slate-500 mr-1">Speed:</span>
          {(["slow", "medium", "fast"] as Speed[]).map(s => (
            <button key={s} type="button" onClick={() => setSpeed(s)}
              className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors ${speed === s ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-blue-100 dark:hover:bg-blue-900/30"}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Custom array */}
        <div className="flex items-center gap-2 flex-1 min-w-40">
          <input
            value={customInput}
            onChange={e => { setCustomInput(e.target.value); setCustomError(""); }}
            placeholder="Custom: 5, 3, 8, 1, …"
            className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-blue-300"
          />
          <button type="button" onClick={applyCustom}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-600 text-white font-semibold hover:bg-slate-700 whitespace-nowrap">
            Use
          </button>
        </div>
        {customError && <p className="w-full text-xs text-red-500">{customError}</p>}
      </div>

      {/* Visualize + playback buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => visualize()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          🔀 Visualize
        </button>
        <button type="button" onClick={newRandom}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-blue-400 transition-all">
          🎲 New Random
        </button>

        {steps.length > 0 && (
          <>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
            <button type="button" onClick={() => step(-1)} disabled={currentStep === 0}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold disabled:opacity-40 hover:border-blue-400 bg-white dark:bg-slate-900">
              ⏮
            </button>
            <button
              type="button"
              onClick={playing ? pause : play}
              className={`px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors ${playing ? "bg-amber-500 hover:bg-amber-600" : "bg-green-600 hover:bg-green-700"}`}
            >
              {playing ? "⏸ Pause" : currentStep >= steps.length - 1 ? "↺ Replay" : "▶ Play"}
            </button>
            <button type="button" onClick={() => step(1)} disabled={currentStep >= steps.length - 1}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold disabled:opacity-40 hover:border-blue-400 bg-white dark:bg-slate-900">
              ⏭
            </button>
            <span className="text-xs text-slate-400 font-mono ml-1">
              {currentStep + 1} / {steps.length}
            </span>
          </>
        )}
      </div>

      {/* Bar chart */}
      {steps.length > 0 && cur ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
          <div className="flex items-end gap-1 h-48">
            {cur.array.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5">
                <div
                  className={`w-full rounded-t transition-all duration-100 ${getBarColor(i, cur)}`}
                  style={{ height: `${Math.max(4, (val / maxVal) * 176)}px` }}
                />
                {cur.array.length <= 20 && (
                  <span className="text-[9px] font-mono text-slate-400">{val}</span>
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {[
              { color: "bg-yellow-400", label: "Comparing" },
              { color: "bg-red-500",    label: "Swapping" },
              { color: "bg-green-500",  label: "Sorted" },
              { color: "bg-blue-500",   label: "Unsorted" },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded-sm ${l.color}`} />
                <span className="text-xs text-slate-500">{l.label}</span>
              </div>
            ))}
          </div>

          {/* Step description */}
          <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-xl">
            {cur.description}
          </p>

          {/* Progress bar */}
          <div className="mt-3 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-12 text-center">
          <p className="text-slate-400 text-sm">Click <strong>Visualize</strong> to start the animation</p>
        </div>
      )}

      {/* Algorithm info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
          <h2 className="text-sm font-bold mb-1">{info.label}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{info.description}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-2">
          {[
            { label: "Best case", value: info.bestCase },
            { label: "Worst case", value: info.worstCase },
            { label: "Space", value: info.space },
          ].map(r => (
            <div key={r.label} className="flex justify-between items-center">
              <span className="text-xs text-slate-500">{r.label}</span>
              <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
