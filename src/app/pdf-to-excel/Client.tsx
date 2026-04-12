"use client";
import { useState } from "react";
import ToolLayout from "@/components/ToolLayout";

export default function Client() {
  const [status, setStatus] = useState("");
  const [url, setUrl] = useState<string | null>(null);

  async function handle(file: File) {
    setUrl(null); setStatus("Reading PDF...");
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      // @ts-ignore
      const mupdf = await import(/* webpackIgnore: true */ "/mupdf/mupdf.js");
      const mod = mupdf.default ?? mupdf;
      const doc = mod.Document.openDocument(buf, "application/pdf");
      const n = doc.countPages();
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();
      for (let i = 0; i < n; i++) {
        setStatus(`Page ${i + 1}/${n}...`);
        const page = doc.loadPage(i);
        const text: string = page.toStructuredText("preserve-whitespace").asText();
        const rows = text.split("\n").map((l: string) => [l]);
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), `Page ${i + 1}`);
        page.destroy();
      }
      doc.destroy();
      const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      setUrl(URL.createObjectURL(blob));
      setStatus("Done!");
    } catch (e) { setStatus("Error: " + (e instanceof Error ? e.message : String(e))); }
  }

  return (
    <ToolLayout>
      <div className="space-y-4">
        <p className="text-sm text-gray-500">Each PDF page becomes a separate Excel sheet.</p>
        <input type="file" accept=".pdf" onChange={e => e.target.files?.[0] && handle(e.target.files[0])} className="block w-full border rounded p-2" />
        {status && <p className="text-sm text-gray-500">{status}</p>}
        {url && <a href={url} download="converted.xlsx" className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Download .xlsx</a>}
      </div>
    </ToolLayout>
  );
}
