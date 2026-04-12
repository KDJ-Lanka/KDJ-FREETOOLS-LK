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
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");
      const children: InstanceType<typeof Paragraph>[] = [];
      for (let i = 0; i < n; i++) {
        setStatus(`Page ${i + 1}/${n}...`);
        const page = doc.loadPage(i);
        const text: string = page.toStructuredText("preserve-whitespace").asText();
        children.push(new Paragraph({ text: `Page ${i + 1}`, heading: HeadingLevel.HEADING_2 }));
        for (const line of text.split("\n")) {
          if (line.trim()) children.push(new Paragraph({ children: [new TextRun(line)] }));
        }
        page.destroy();
      }
      doc.destroy();
      setStatus("Building .docx...");
      const blob = await Packer.toBlob(new Document({ sections: [{ children }] }));
      setUrl(URL.createObjectURL(blob));
      setStatus("Done!");
    } catch (e) { setStatus("Error: " + (e instanceof Error ? e.message : String(e))); }
  }

  return (
    <ToolLayout>
      <div className="space-y-4">
        <p className="text-sm text-gray-500">Extracts text content - complex layouts and images are not preserved.</p>
        <input type="file" accept=".pdf" onChange={e => e.target.files?.[0] && handle(e.target.files[0])} className="block w-full border rounded p-2" />
        {status && <p className="text-sm text-gray-500">{status}</p>}
        {url && <a href={url} download="converted.docx" className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Download .docx</a>}
      </div>
    </ToolLayout>
  );
}
