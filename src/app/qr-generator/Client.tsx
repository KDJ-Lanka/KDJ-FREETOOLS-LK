"use client";
import { useState } from "react";

export default function Client() {
  const [text, setText] = useState("https://freetools.lk");
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  async function generate() {
    if (!text.trim()) return;
    setGenerating(true);
    try {
      const QRCode = (await import("qrcode")).default;
      const canvas = document.createElement("canvas");
      await QRCode.toCanvas(canvas, text, { width: 400, margin: 2 });
      canvas.toBlob(blob => {
        if (blob) setQrUrl(URL.createObjectURL(blob));
      });
    } finally {
      setGenerating(false);
    }
  }

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">📱</span>
            <h1 className="text-2xl sm:text-3xl font-black">QR Code Generator</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400">
            Generate QR codes for URLs, text or contacts instantly. 100% browser-based.
          </p>
        </div>
        <div className="space-y-4">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={3}
            placeholder="Enter URL or text..."
            className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-900 text-sm"
          />
          <button
            onClick={generate}
            disabled={generating}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 font-semibold text-sm"
          >
            {generating ? "Generating..." : "Generate QR Code"}
          </button>
          {qrUrl && (
            <div className="flex items-center gap-6 mt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUrl} alt="QR code" className="border rounded-xl" style={{ width: 200, height: 200 }} />
              <a
                href={qrUrl}
                download="qrcode.png"
                className="inline-block bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 font-semibold text-sm"
              >
                Download PNG
              </a>
            </div>
          )}
        </div>
      </main>
  );
}
