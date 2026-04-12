"use client";
import { useState } from "react";

export default function Client() {
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [format, setFormat] = useState<"image/webp" | "image/avif">("image/webp");
  const [quality, setQuality] = useState(85);
  const [origSize, setOrigSize] = useState(0);
  const [newSize, setNewSize] = useState(0);

  async function handleFile(file: File) {
    setOrigSize(file.size);
    setOutputUrl(null);
    const img = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext("2d")!.drawImage(img, 0, 0);
    canvas.toBlob(blob => {
      if (blob) {
        setNewSize(blob.size);
        setOutputUrl(URL.createObjectURL(blob));
      }
    }, format, quality / 100);
  }

  const ext = format === "image/webp" ? "webp" : "avif";

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🖼️</span>
            <h1 className="text-2xl sm:text-3xl font-black">Image to WebP / AVIF</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400">
            Convert images to modern WebP or AVIF format. Smaller files, same quality — browser-only.
          </p>
        </div>
        <div className="space-y-4">
          <div className="flex gap-4 items-center flex-wrap">
            <label className="text-sm font-medium">Format:</label>
            <select
              value={format}
              onChange={e => setFormat(e.target.value as "image/webp" | "image/avif")}
              className="border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-sm bg-white dark:bg-slate-900"
            >
              <option value="image/webp">WebP</option>
              <option value="image/avif">AVIF</option>
            </select>
            <label className="text-sm font-medium">Quality: {quality}%</label>
            <input
              type="range"
              min={1}
              max={100}
              value={quality}
              onChange={e => setQuality(+e.target.value)}
              className="w-32"
            />
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="block w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-900 text-sm"
          />
          {outputUrl && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Original: {(origSize / 1024).toFixed(1)} KB → {ext.toUpperCase()}: {(newSize / 1024).toFixed(1)} KB
                {origSize > 0 && ` (${Math.round((1 - newSize / origSize) * 100)}% smaller)`}
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={outputUrl} alt="converted" className="rounded-xl border border-slate-200 dark:border-slate-700 max-w-full max-h-64 object-contain" />
              <a
                href={outputUrl}
                download={`converted.${ext}`}
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 font-semibold text-sm"
              >
                Download .{ext}
              </a>
            </div>
          )}
        </div>
      </main>
  );
}
