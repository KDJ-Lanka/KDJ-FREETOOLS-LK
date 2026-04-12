"use client";
import { useState } from "react";
import ToolLayout from "@/components/ToolLayout";

export default function Client() {
  const [status, setStatus] = useState("");
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [crop, setCrop] = useState({ top: 0, right: 0, bottom: 0, left: 0 });
  const [url, setUrl] = useState<string | null>(null);

  async function load(file: File) {
    const buf = new Uint8Array(await file.arrayBuffer());
    setBytes(buf); setUrl(null);
    const { PDFDocument } = await import("pdf-lib");
    const doc = await PDFDocument.load(buf);
    const pg = doc.getPage(0);
    const { width, height } = pg.getSize();
    setSize({ w: Math.round(width), h: Math.round(height) });
    setStatus(`Page size: ${Math.round(width)} x ${Math.round(height)} pts`);
  }

  async function process() {
    if (!bytes || !size) return;
    const { PDFDocument } = await import("pdf-lib");
    const doc = await PDFDocument.load(bytes);
    for (const pg of doc.getPages()) {
      const { width, height } = pg.getSize();
      pg.setCropBox(crop.left, crop.bottom, width - crop.left - crop.right, height - crop.top - crop.bottom);
    }
    const out = await doc.save();
    setUrl(URL.createObjectURL(new Blob([out.buffer as ArrayBuffer], { type: "application/pdf" })));
    setStatus("Done!");
  }

  return (
    <ToolLayout>
      <div className="space-y-4">
        <input type="file" accept=".pdf" onChange={e => e.target.files?.[0] && load(e.target.files[0])} className="block w-full border rounded p-2" />
        {status && <p className="text-sm text-gray-500">{status}</p>}
        {size && (
          <div className="grid grid-cols-2 gap-3">
            {(["top", "right", "bottom", "left"] as const).map(s => (
              <label key={s} className="flex flex-col text-sm capitalize font-medium">
                {s} (pts)
                <input type="number" min={0} value={crop[s]} onChange={e => setCrop(c => ({ ...c, [s]: +e.target.value }))} className="border rounded p-1 mt-1" />
              </label>
            ))}
            <button onClick={process} className="col-span-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Crop PDF</button>
          </div>
        )}
        {url && <a href={url} download="cropped.pdf" className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Download Cropped PDF</a>}
      </div>
    </ToolLayout>
  );
}
