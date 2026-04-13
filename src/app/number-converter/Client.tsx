"use client";
import { useState, useMemo } from "react";

interface BaseInfo {
  value: number;
  name: string;
  short: string;
  prefix: string;
  regex: RegExp;
  placeholder: string;
}

const BASES: BaseInfo[] = [
  { value: 2,  name: "Binary",      short: "BIN", prefix: "0b", regex: /^[01]+$/,         placeholder: "e.g. 11001010" },
  { value: 8,  name: "Octal",       short: "OCT", prefix: "0o", regex: /^[0-7]+$/,        placeholder: "e.g. 312" },
  { value: 10, name: "Decimal",     short: "DEC", prefix: "",   regex: /^[0-9]+$/,        placeholder: "e.g. 202" },
  { value: 16, name: "Hexadecimal", short: "HEX", prefix: "0x", regex: /^[0-9a-fA-F]+$/i, placeholder: "e.g. CA" },
];

function toDecimalSteps(value: string, fromBase: number): { expansion: string; evaluated: string; result: number } {
  const s = value.toUpperCase();
  const n = s.length;
  const terms = s.split("").map((d, i) => {
    const pow = n - 1 - i;
    const dVal = parseInt(d, fromBase);
    return { d, pow, dVal, contrib: dVal * Math.pow(fromBase, pow) };
  });
  const expansion = terms.map(t => `${t.d}×${fromBase}^${t.pow}`).join(" + ");
  const evaluated = terms.map(t => String(t.contrib)).join(" + ");
  const result = terms.reduce((acc, t) => acc + t.contrib, 0);
  return { expansion, evaluated, result };
}

function fromDecimalSteps(decimal: number, toBase: number): { lines: string[]; result: string } {
  if (decimal === 0) return { lines: ["0 ÷ " + toBase + " = 0 remainder 0"], result: "0" };
  const lines: string[] = [];
  const remainders: string[] = [];
  let n = decimal;
  while (n > 0) {
    const rem = n % toBase;
    const remStr = rem.toString(toBase).toUpperCase();
    lines.push(`${n} ÷ ${toBase} = ${Math.floor(n / toBase)}  remainder  ${remStr}`);
    remainders.push(remStr);
    n = Math.floor(n / toBase);
  }
  const result = remainders.reverse().join("");
  lines.push(`↑ Read remainders bottom-up: ${result}`);
  return { lines, result };
}

export default function Client() {
  const [input, setInput] = useState("255");
  const [fromBase, setFromBase] = useState(10);
  const [openSteps, setOpenSteps] = useState<number | null>(null);

  const fromInfo = BASES.find(b => b.value === fromBase)!;
  const isValid = input !== "" && fromInfo.regex.test(input);
  const decimal = isValid ? parseInt(input, fromBase) : NaN;

  const results = useMemo(() => {
    if (!isValid || isNaN(decimal)) return null;
    return BASES.map(b => ({
      base: b,
      value: decimal.toString(b.value).toUpperCase(),
    }));
  }, [isValid, decimal]);

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">🔢</span>
          <h1 className="text-2xl sm:text-3xl font-black">Number System Converter</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Convert between Binary, Octal, Decimal &amp; Hexadecimal — with step-by-step working.
        </p>
      </div>

      {/* Input */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Enter Number
            </label>
            <input
              value={input}
              onChange={e => { setInput(e.target.value.trim()); setOpenSteps(null); }}
              placeholder={fromInfo.placeholder}
              className={`w-full px-4 py-3 rounded-xl border text-xl font-mono font-bold focus:outline-none focus:ring-2 transition-colors ${
                input && !isValid
                  ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 focus:ring-red-300"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-blue-300 dark:focus:ring-blue-700"
              }`}
            />
            {input && !isValid && (
              <p className="text-xs text-red-500 mt-1">
                Invalid character for {fromInfo.name} (base {fromBase})
              </p>
            )}
          </div>

          <div className="sm:w-56">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              From Base
            </label>
            <div className="grid grid-cols-2 gap-2">
              {BASES.map(b => (
                <button
                  key={b.value}
                  type="button"
                  onClick={() => { setFromBase(b.value); setInput(""); setOpenSteps(null); }}
                  className={`px-3 py-2 rounded-xl text-sm font-bold border transition-all ${
                    fromBase === b.value
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-blue-400"
                  }`}
                >
                  {b.short} ({b.value})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {results.map(r => {
            const isSelf = r.base.value === fromBase;
            const open = openSteps === r.base.value;
            return (
              <div
                key={r.base.value}
                className={`rounded-2xl border p-5 ${
                  isSelf
                    ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-mono">
                      Base {r.base.value}
                    </span>
                    <span className="text-xs text-slate-400">{r.base.name}</span>
                  </div>
                  {!isSelf && (
                    <button
                      type="button"
                      onClick={() => setOpenSteps(open ? null : r.base.value)}
                      className="text-xs text-blue-500 hover:text-blue-700 font-semibold"
                    >
                      {open ? "Hide" : "Show"} steps
                    </button>
                  )}
                </div>

                <p className="font-mono text-2xl font-black text-slate-800 dark:text-slate-100 break-all">
                  {r.base.prefix}{r.value}
                </p>

                {!isSelf && open && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                    {/* Step 1: source to decimal */}
                    {fromBase !== 10 && (
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                          {fromInfo.name} → Decimal
                        </p>
                        {(() => {
                          const { expansion, evaluated, result } = toDecimalSteps(input, fromBase);
                          return (
                            <div className="space-y-0.5 font-mono text-xs text-slate-600 dark:text-slate-400">
                              <p>{input.toUpperCase()} = {expansion}</p>
                              <p className="pl-4">= {evaluated}</p>
                              <p className="pl-4 font-bold text-slate-700 dark:text-slate-200">= {result}</p>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Step 2: decimal to target */}
                    {r.base.value !== 10 && (
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                          Decimal → {r.base.name}
                        </p>
                        {(() => {
                          const { lines } = fromDecimalSteps(decimal, r.base.value);
                          return (
                            <div className="space-y-0.5 font-mono text-xs text-slate-600 dark:text-slate-400">
                              {lines.map((l, i) => (
                                <p key={i} className={i === lines.length - 1 ? "font-bold text-slate-700 dark:text-slate-200" : ""}>{l}</p>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Quick reference table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 overflow-x-auto">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4">Quick Reference (0 – 15)</h2>
        <table className="text-xs font-mono min-w-full">
          <thead>
            <tr>
              {["Dec", "Bin", "Oct", "Hex"].map(h => (
                <th key={h} className="text-left pr-6 pb-2 font-bold text-slate-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {Array.from({ length: 16 }, (_, i) => (
              <tr
                key={i}
                className={`${!isNaN(decimal) && decimal === i ? "bg-blue-50 dark:bg-blue-950/30" : ""}`}
              >
                <td className={`pr-6 py-1 ${!isNaN(decimal) && decimal === i ? "font-bold text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400"}`}>{i}</td>
                <td className={`pr-6 py-1 ${!isNaN(decimal) && decimal === i ? "font-bold text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400"}`}>{i.toString(2).padStart(4, "0")}</td>
                <td className={`pr-6 py-1 ${!isNaN(decimal) && decimal === i ? "font-bold text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400"}`}>{i.toString(8)}</td>
                <td className={`pr-6 py-1 ${!isNaN(decimal) && decimal === i ? "font-bold text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400"}`}>{i.toString(16).toUpperCase()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
