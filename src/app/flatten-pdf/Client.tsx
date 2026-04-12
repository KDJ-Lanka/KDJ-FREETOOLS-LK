"use client";
import { useState } from "react";
import ToolLayout from "@/components/ToolLayout";

export default function Client() {
  const [status, setStatus] = useState("");
  const [url, setUrl] = useState<string | null>(null);

  async function handle(file: File) {
    setStatus("Flattening..."); setUrl(null);
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      // @ts-ignore
      const mupdf = await import(/* webpackIgnore: true */ "/mupdf/mupdf.js");
      const mod = mupdf.default ?? mupdf;
      const doc = mod.Document.openDocument(buf, "application/pdf");
      const raw = doc.saveToBuffer("compress,garbage=4,clean,sanitize").asUint8Array().slice();
      doc.destroy();
      setUrl(URL.createObjectURL(new Blob([raw], { type: "application/pdf" })));
      setStatus("Flattened successfully!");
    } catch (e) { setStatus("Error: " + (e instanceof Error ? e.message : String(e))); }
  }

  return (
    <ToolLayout>
      <div className="space-y-4">
        <p className="text-sm text-gray-500">Permanently embeds form fields and annotations - they can no longer be edited.</p>
        <input type="file" accept=".pdf" onChange={e => e.target.files?.[0] && handle(e.target.files[0])} className="block w-full border rounded p-2" />
        {status && <p className="text-sm text-gray-500">{status}</p>}
        {url && <a href={url} download="flattened.pdf" className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Download Flattened PDF</a>}
      </div>
    </ToolLayout>
  );
}
