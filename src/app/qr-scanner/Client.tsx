"use client";
import { useState } from "react";

export default function Client() {
  const [result, setResult] = useState("");
  const [status, setStatus] = useState("");

  async function handleFile(file: File) {
    setStatus("Scanning...");
    setResult("");
    try {
      const img = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const jsQR = (await import("jsqr")).default;
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code) {
        setResult(code.data);
        setStatus("QR code found!");
      } else {
        setStatus("No QR code found in image.");
      }
    } catch (e) {
      setStatus("Error: " + (e instanceof Error ? e.message : String(e)));
    }
  }

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">📷</span>
            <h1 className="text-2xl sm:text-3xl font-black">QR Code Scanner</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400">
            Upload an image containing a QR code to decode it instantly. Browser-only, no uploads.
          </p>
        </div>
        <div className="space-y-4">
          <input
            type="file"
            accept="image/*"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="block w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-900 text-sm"
          />
          {status && <p className="text-sm text-slate-500">{status}</p>}
          {result && (
            <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl">
              <p className="text-sm font-semibold text-green-800 dark:text-green-400 mb-1">Decoded:</p>
              <p className="break-all text-sm">{result}</p>
              {result.startsWith("http") && (
                <a
                  href={result}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-blue-600 underline text-sm"
                >
                  Open URL →
                </a>
              )}
              <button
                onClick={() => navigator.clipboard.writeText(result)}
                className="mt-2 ml-4 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-xs font-semibold"
              >
                Copy
              </button>
            </div>
          )}
        </div>
      </main>
  );
}
