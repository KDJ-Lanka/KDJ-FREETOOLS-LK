"use client";
import { useState } from "react";
import ToolLayout from "@/components/ToolLayout";

export default function Client() {
  const [status, setStatus] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [input, setInput] = useState("");
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  async function load(file: File) {
    const buf = new Uint8Array(await file.arrayBuffer());
    setBytes(buf); setUrl(null);
    const { PDFDocument } = await import("pdf-lib");
    const doc = await PDFDocument.load(buf);
    setPageCount(doc.getPageCount());
    setStatus(`${doc.getPageCount()} pages loaded.`);
  }

  async function process() {
    if (!bytes) return;
    const nums = [...new Set(input.split(",").map(s => parseInt(s.trim())).filter(n => n >= 1 && n <= pageCount))].sort((a, b) => b - a);
    if (!nums.length) { setStatus("Enter valid page numbers."); return; }
    const { PDFDocument } = await import("pdf-lib");
    const doc = await PDFDocument.load(bytes);
    for (const n of nums) doc.removePage(n - 1);
    const out = await doc.save();
    setUrl(URL.createObjectURL(new Blob([out.buffer as ArrayBuffer], { type: "application/pdf" })));
    setStatus(`Removed ${nums.length} page(s).`);
  }

  return (
    <ToolLayout>
      <div className="space-y-4">
        <input type="file" accept=".pdf" onChange={e => e.target.files?.[0] && load(e.target.files[0])} className="block w-full border rounded p-2" />
        {pageCount > 0 && (
          <>
            <p className="text-sm text-gray-500">{status}</p>
            <input type="text" placeholder="Pages to delete, e.g. 2, 4, 7" value={input} onChange={e => setInput(e.target.value)} className="block w-full border rounded p-2" />
            <button onClick={process} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Delete Pages</button>
          </>
        )}
        {status && !pageCount && <p className="text-sm text-gray-500">{status}</p>}
        {url && <a href={url} download="deleted-pages.pdf" className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Download PDF</a>}
      </div>
    </ToolLayout>
  );
}
