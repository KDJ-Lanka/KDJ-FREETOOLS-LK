"use client";
import { useState, useMemo } from "react";

// ── Gate definitions ──────────────────────────────────────────────────────
type GateId = "AND" | "OR" | "NOT" | "NAND" | "NOR" | "XOR" | "XNOR";

interface GateDef {
  id: GateId;
  symbol: string;
  twoInput: boolean;
  expression: string;
  description: string;
  fn: (a: number, b: number) => number;
}

const GATES: GateDef[] = [
  { id: "AND",  symbol: "AND",  twoInput: true,  expression: "Y = A · B",   description: "Output is HIGH only when both A and B are HIGH.",         fn: (a, b) => a & b },
  { id: "OR",   symbol: "OR",   twoInput: true,  expression: "Y = A + B",   description: "Output is HIGH when at least one input is HIGH.",         fn: (a, b) => a | b },
  { id: "NOT",  symbol: "NOT",  twoInput: false, expression: "Y = A'",      description: "Output is the INVERSE (complement) of the input.",        fn: (a)    => a ^ 1 },
  { id: "NAND", symbol: "NAND", twoInput: true,  expression: "Y = (A · B)'",description: "Output is LOW only when both inputs are HIGH. (NOT AND)", fn: (a, b) => (a & b) ^ 1 },
  { id: "NOR",  symbol: "NOR",  twoInput: true,  expression: "Y = (A + B)'",description: "Output is HIGH only when both inputs are LOW. (NOT OR)",  fn: (a, b) => (a | b) ^ 1 },
  { id: "XOR",  symbol: "XOR",  twoInput: true,  expression: "Y = A ⊕ B",   description: "Output is HIGH when inputs are DIFFERENT.",              fn: (a, b) => a ^ b },
  { id: "XNOR", symbol: "XNOR", twoInput: true,  expression: "Y = (A ⊕ B)'",description: "Output is HIGH when inputs are the SAME.",               fn: (a, b) => (a ^ b) ^ 1 },
];

// ── Wire signal indicator ─────────────────────────────────────────────────
function Signal({ value, label, side, onClick }: {
  value: number; label: string; side: "in" | "out"; onClick?: () => void;
}) {
  return (
    <div className={`flex items-center gap-2 ${side === "out" ? "flex-row-reverse" : ""}`}>
      <span className="text-xs font-mono font-bold text-slate-500 w-3 text-center">{label}</span>
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center font-bold font-mono text-sm transition-all select-none ${
          value
            ? "bg-green-500 border-green-600 text-white shadow shadow-green-400/50"
            : "bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-500"
        } ${onClick ? "cursor-pointer active:scale-95" : "cursor-default"}`}
      >
        {value}
      </button>
    </div>
  );
}

// ── Gate body block ───────────────────────────────────────────────────────
function GateBlock({ gate, output }: { gate: GateDef; output: number }) {
  return (
    <div className={`relative flex flex-col items-center justify-center px-5 py-3 rounded-2xl border-2 font-bold font-mono text-sm min-w-[72px] transition-colors ${
      output
        ? "border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400"
        : "border-slate-400 dark:border-slate-500 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
    }`}>
      {gate.id}
      <span className="text-[10px] font-normal text-slate-400 mt-0.5">{gate.symbol}</span>
    </div>
  );
}

// ── Wire line ─────────────────────────────────────────────────────────────
function Wire({ active }: { active: boolean }) {
  return (
    <div className={`h-0.5 w-8 sm:w-12 transition-colors ${active ? "bg-green-500" : "bg-slate-300 dark:bg-slate-600"}`} />
  );
}

// ── Truth table ───────────────────────────────────────────────────────────
function TruthTable({ gate, a, b }: { gate: GateDef; a: number; b: number }) {
  const rows = gate.twoInput
    ? [[0,0],[0,1],[1,0],[1,1]]
    : [[0],[1]];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
      <table className="w-full text-sm font-mono">
        <thead className="bg-slate-100 dark:bg-slate-800">
          <tr>
            <th className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300">A</th>
            {gate.twoInput && <th className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300">B</th>}
            <th className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300">Y</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((inputs, i) => {
            const rowA = inputs[0];
            const rowB = gate.twoInput ? inputs[1] : 0;
            const rowY = gate.fn(rowA, rowB);
            const isActive = gate.twoInput ? rowA === a && rowB === b : rowA === a;
            return (
              <tr
                key={i}
                className={`border-t border-slate-100 dark:border-slate-800 transition-colors ${
                  isActive ? "bg-blue-50 dark:bg-blue-950/30 font-bold" : "bg-white dark:bg-slate-900"
                }`}
              >
                <td className={`px-4 py-2 text-center ${rowA ? "text-green-600 dark:text-green-400" : "text-slate-500"}`}>{rowA}</td>
                {gate.twoInput && (
                  <td className={`px-4 py-2 text-center ${rowB ? "text-green-600 dark:text-green-400" : "text-slate-500"}`}>{rowB}</td>
                )}
                <td className={`px-4 py-2 text-center ${rowY ? "text-green-600 dark:text-green-400" : "text-slate-500"}`}>{rowY}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────
export default function Client() {
  const [gateId, setGateId] = useState<GateId>("AND");
  const [a, setA] = useState(1);
  const [b, setB] = useState(0);

  const gate = GATES.find(g => g.id === gateId)!;
  const output = useMemo(() => gate.fn(a, b), [gate, a, b]);

  const toggle = (which: "a" | "b") => {
    if (which === "a") setA(v => v ^ 1);
    else setB(v => v ^ 1);
  };

  const switchGate = (id: GateId) => {
    setGateId(id);
    setA(1); setB(0);
  };

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">⚡</span>
          <h1 className="text-2xl sm:text-3xl font-black">Logic Gate Simulator</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Toggle inputs and see outputs instantly. Explore AND, OR, NOT, NAND, NOR, XOR, XNOR gates with live truth tables.
        </p>
      </div>

      {/* Gate selector */}
      <div className="flex flex-wrap gap-2">
        {GATES.map(g => (
          <button
            key={g.id}
            type="button"
            onClick={() => switchGate(g.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
              gateId === g.id
                ? "bg-blue-600 border-blue-600 text-white"
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-blue-400"
            }`}
          >
            {g.id}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Interactive diagram */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-6">Interactive Circuit</h2>

          {/* Gate diagram */}
          <div className="flex items-center justify-center gap-0">
            {/* Inputs */}
            <div className="flex flex-col gap-4">
              <Signal value={a} label="A" side="in" onClick={() => toggle("a")} />
              {gate.twoInput && (
                <Signal value={b} label="B" side="in" onClick={() => toggle("b")} />
              )}
            </div>

            {/* Input wires */}
            <div className="flex flex-col gap-4">
              <Wire active={!!a} />
              {gate.twoInput && <Wire active={!!b} />}
            </div>

            {/* Gate */}
            <GateBlock gate={gate} output={output} />

            {/* Output wire */}
            <Wire active={!!output} />

            {/* Output */}
            <Signal value={output} label="Y" side="out" />
          </div>

          <p className="text-xs text-slate-400 text-center mt-6">
            Click <strong>A</strong>{gate.twoInput ? " or <strong>B</strong>" : ""} to toggle
          </p>

          {/* Expression */}
          <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Boolean Expression</p>
            <p className="text-xl font-mono font-bold text-slate-800 dark:text-slate-100">{gate.expression}</p>
          </div>

          {/* Current output callout */}
          <div className={`mt-4 rounded-xl p-3 text-center text-sm font-bold transition-colors ${
            output
              ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
              : "bg-slate-50 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700"
          }`}>
            {gate.twoInput
              ? `A=${a}, B=${b} → Y = ${output} (${output ? "HIGH" : "LOW"})`
              : `A=${a} → Y = ${output} (${output ? "HIGH" : "LOW"})`
            }
          </div>
        </div>

        {/* Truth table + info */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Truth Table</h2>
            <TruthTable gate={gate} a={a} b={b} />
            <p className="text-xs text-slate-400 mt-2 text-center">Highlighted row = current input state</p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">About {gate.id} Gate</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">{gate.description}</p>
          </div>
        </div>
      </div>

      {/* All gates quick reference */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4">All Gates Reference</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs font-mono">
            <thead>
              <tr className="text-slate-400">
                <th className="text-left pr-6 py-1.5 font-bold">Gate</th>
                <th className="text-left pr-6 py-1.5 font-bold">Expression</th>
                <th className="text-left pr-6 py-1.5 font-bold">A=0,B=0</th>
                <th className="text-left pr-6 py-1.5 font-bold">A=0,B=1</th>
                <th className="text-left pr-6 py-1.5 font-bold">A=1,B=0</th>
                <th className="text-left pr-6 py-1.5 font-bold">A=1,B=1</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {GATES.map(g => (
                <tr
                  key={g.id}
                  onClick={() => switchGate(g.id)}
                  className={`cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors ${gateId === g.id ? "bg-blue-50 dark:bg-blue-950/20 font-bold" : ""}`}
                >
                  <td className="pr-6 py-1.5 font-bold text-slate-700 dark:text-slate-300">{g.id}</td>
                  <td className="pr-6 py-1.5 text-slate-500">{g.expression}</td>
                  {g.twoInput
                    ? [[0,0],[0,1],[1,0],[1,1]].map(([ra,rb], i) => (
                        <td key={i} className={`pr-6 py-1.5 ${g.fn(ra,rb) ? "text-green-600 dark:text-green-400" : "text-slate-400"}`}>
                          {g.fn(ra, rb)}
                        </td>
                      ))
                    : [[0],[1],[0],[1]].map(([ra], i) => (
                        <td key={i} className={`pr-6 py-1.5 ${i > 1 ? "text-slate-300 dark:text-slate-600 italic" : g.fn(ra,0) ? "text-green-600 dark:text-green-400" : "text-slate-400"}`}>
                          {i > 1 ? "—" : g.fn(ra, 0)}
                        </td>
                      ))
                  }
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-400 mt-2">Click any row to switch to that gate.</p>
      </div>
    </main>
  );
}
