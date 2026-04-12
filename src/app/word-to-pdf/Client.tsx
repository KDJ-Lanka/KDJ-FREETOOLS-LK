"use client";
import { useState } from "react";
import ToolLayout from "@/components/ToolLayout";

export default function Client() {
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState("");
  const [url, setUrl] = useState<string | null>(null);

  async function handle(file: File) {
    setStatus("Reading .docx..."); setPreview(""); setUrl(null);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(await file.arrayBuffer());
      const xmlFile = zip.file("word/document.xml");
      if (!xmlFile) throw new Error("Not a valid .docx file");
      const xml = await xmlFile.async("string");
      const text = xml
        .replace(/<w:p[ >]/g, "\n<w:p>")
        .replace(/<[^>]+>/g, "")
        .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&#xD;/g, "")
        .split("\n").map((l: string) => l.trim()).filter(Boolean).join("\n");
      setPreview(text);
      setStatus("Building PDF...");
      const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const fontSize = 11;
      const margin = 50;
      const lineH = fontSize * 1.4;
      let page = doc.addPage([595, 842]);
      let yPos = 842 - margin;
      for (const line of text.split("\n")) {
        const words = line.split(" ");
        let row = "";
        for (const word of words) {
          const test = row ? row + " " + word : word;
          if (font.widthOfTextAtSize(test, fontSize) > 595 - margin * 2) {
            if (yPos < margin + lineH) { page = doc.addPage([595, 842]); yPos = 842 - margin; }
            page.drawText(row, { x: margin, y: yPos, size: fontSize, font, color: rgb(0, 0, 0) });
            yPos -= lineH; row = word;
          } else { row = test; }
        }
        if (row) {
          if (yPos < margin + lineH) { page = doc.addPage([595, 842]); yPos = 842 - margin; }
          page.drawText(row, { x: margin, y: yPos, size: fontSize, font, color: rgb(0, 0, 0) });
          yPos -= lineH;
        }
        yPos -= lineH * 0.3;
      }
      const out = await doc.save();
      setUrl(URL.createObjectURL(new Blob([out.buffer as ArrayBuffer], { type: "application/pdf" })));
      setStatus("Done!");
    } catch (e) { setStatus("Error: " + (e instanceof Error ? e.message : String(e))); }
  }

  return (
    <ToolLayout>
      <div className="space-y-4">
        <p className="text-sm text-gray-500">Converts .docx text content to PDF - formatting may not be preserved.</p>
        <input type="file" accept=".docx" onChange={e => e.target.files?.[0] && handle(e.target.files[0])} className="block w-full border rounded p-2" />
        {status && <p className="text-sm text-gray-500">{status}</p>}
        {preview && <textarea value={preview} readOnly rows={8} className="w-full border rounded p-2 text-sm font-mono" />}
        {url && <a href={url} download="converted.pdf" className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Download PDF</a>}
      </div>
    </ToolLayout>
  );
}
