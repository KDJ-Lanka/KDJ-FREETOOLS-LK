"use client";
import { useState } from "react";
import ToolLayout from "@/components/ToolLayout";

export default function Client() {
  const [status, setStatus] = useState("");
  const [html, setHtml] = useState("");
  const [url, setUrl] = useState<string | null>(null);

  async function handle(file: File) {
    setHtml(""); setUrl(null); setStatus("Converting...");
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      // @ts-ignore
      const mupdf = await import(/* webpackIgnore: true */ "/mupdf/mupdf.js");
      const mod = mupdf.default ?? mupdf;
      const doc = mod.Document.openDocument(buf, "application/pdf");
      const n = doc.countPages();
      let out = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:sans-serif;max-width:800px;margin:auto;padding:2rem}h2{border-bottom:1px solid #ddd}p{margin:.2rem 0}</style></head><body>`;
      for (let i = 0; i < n; i++) {
        setStatus(`Page ${i + 1}/${n}...`);
        const page = doc.loadPage(i);
        const text: string = page.toStructuredText("preserve-whitespace").asText();
        out += `<h2>Page ${i + 1}</h2>`;
        for (const line of text.split("\n")) {
          if (line.trim()) out += `<p>${line.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</p>`;
        }
        page.destroy();
      }
      doc.destroy();
      out += `</body></html>`;
      setHtml(out);
      setUrl(URL.createObjectURL(new Blob([out], { type: "text/html" })));
      setStatus("Done!");
    } catch (e) { setStatus("Error: " + (e instanceof Error ? e.message : String(e))); }
  }

  return (
    <ToolLayout>
      <div className="space-y-4">
        <input type="file" accept=".pdf" onChange={e => e.target.files?.[0] && handle(e.target.files[0])} className="block w-full border rounded p-2" />
        {status && <p className="text-sm text-gray-500">{status}</p>}
        {url && <a href={url} download="converted.html" className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Download HTML</a>}
        {html && <iframe srcDoc={html} className="w-full border rounded mt-2" style={{ height: 400 }} title="Preview" sandbox="allow-same-origin" />}
      </div>
    </ToolLayout>
  );
}
