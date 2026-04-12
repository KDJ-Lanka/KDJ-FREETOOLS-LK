"use client";
import { useState } from "react";
import ToolLayout from "@/components/ToolLayout";

export default function Client() {
  const [status, setStatus] = useState("");
  const [previews, setPreviews] = useState<string[]>([]);
  const [zipUrl, setZipUrl] = useState<string | null>(null);

  async function handle(file: File) {
    setPreviews([]); setZipUrl(null); setStatus("Rendering pages...");
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      // @ts-ignore
      const mupdf = await import(/* webpackIgnore: true */ "/mupdf/mupdf.js");
      const mod = mupdf.default ?? mupdf;
      const doc = mod.Document.openDocument(buf, "application/pdf");
      const n = doc.countPages();
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const urls: string[] = [];
      for (let i = 0; i < n; i++) {
        setStatus(`Rendering page ${i + 1}/${n}...`);
        const page = doc.loadPage(i);
        const mat = mod.Matrix.scale(2, 2);
        const px = page.toPixmap(mat, mod.ColorSpace.DeviceRGB);
        const jpegRaw = px.asJPEG(90);
        const bytes = (jpegRaw instanceof Uint8Array ? jpegRaw : new Uint8Array(jpegRaw)).slice();
        zip.file(`page-${i + 1}.jpg`, bytes);
        urls.push(URL.createObjectURL(new Blob([bytes], { type: "image/jpeg" })));
        px.destroy(); page.destroy();
      }
      doc.destroy();
      setPreviews(urls);
      const blob = await zip.generateAsync({ type: "blob" });
      setZipUrl(URL.createObjectURL(blob));
      setStatus(`${n} pages extracted.`);
    } catch (e) { setStatus("Error: " + (e instanceof Error ? e.message : String(e))); }
  }

  return (
    <ToolLayout>
      <div className="space-y-4">
        <input type="file" accept=".pdf" onChange={e => e.target.files?.[0] && handle(e.target.files[0])} className="block w-full border rounded p-2" />
        {status && <p className="text-sm text-gray-500">{status}</p>}
        {zipUrl && <a href={zipUrl} download="pdf-pages.zip" className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Download All as ZIP</a>}
        {previews.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {previews.map((u, i) => (
              <a key={i} href={u} download={`page-${i + 1}.jpg`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt={`Page ${i + 1}`} className="rounded border hover:opacity-80 w-full" />
              </a>
            ))}
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
