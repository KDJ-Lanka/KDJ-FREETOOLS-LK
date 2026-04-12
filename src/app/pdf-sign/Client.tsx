"use client";
import { useRef, useState } from "react";
import ToolLayout from "@/components/ToolLayout";

export default function Client() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [x, setX] = useState(50);
  const [y, setY] = useState(50);
  const [w, setW] = useState(200);
  const [status, setStatus] = useState("");
  const [url, setUrl] = useState<string | null>(null);

  function pt(e: React.MouseEvent) {
    const c = canvasRef.current!; const r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
  }

  function draw(e: React.MouseEvent) {
    if (!drawing) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = pt(e);
    ctx.beginPath(); ctx.strokeStyle = "#000"; ctx.lineWidth = 2; ctx.lineCap = "round";
    ctx.moveTo(last.current!.x, last.current!.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    last.current = p;
  }

  async function loadPdf(file: File) {
    const buf = new Uint8Array(await file.arrayBuffer());
    setBytes(buf); setUrl(null);
    const { PDFDocument } = await import("pdf-lib");
    const doc = await PDFDocument.load(buf);
    setPages(doc.getPageCount()); setStatus(`${doc.getPageCount()} pages loaded.`);
  }

  async function embed() {
    if (!bytes) { setStatus("Upload a PDF first."); return; }
    setStatus("Embedding...");
    const blob = await new Promise<Blob>(r => canvasRef.current!.toBlob(b => r(b!), "image/png"));
    const sigBytes = new Uint8Array(await blob.arrayBuffer());
    const { PDFDocument } = await import("pdf-lib");
    const doc = await PDFDocument.load(bytes);
    const img = await doc.embedPng(sigBytes);
    const pg = doc.getPage(page - 1);
    const { height } = pg.getSize();
    const h = w * (150 / 400);
    pg.drawImage(img, { x, y: height - y - h, width: w, height: h });
    const out = await doc.save() as unknown as Uint8Array<ArrayBuffer>;
    setUrl(URL.createObjectURL(new Blob([out], { type: "application/pdf" })));
    setStatus("Signature embedded!");
  }

  return (
    <ToolLayout>
      <div className="space-y-4">
        <p className="text-sm font-medium">Step 1 - Draw your signature:</p>
        <canvas ref={canvasRef} width={400} height={150}
          style={{ border: "1px solid #ccc", borderRadius: 8, cursor: "crosshair", width: "100%", maxWidth: 400, background: "#fff", touchAction: "none" }}
          onMouseDown={e => { setDrawing(true); last.current = pt(e); }}
          onMouseMove={draw} onMouseUp={() => setDrawing(false)} onMouseLeave={() => setDrawing(false)} />
        <button onClick={() => canvasRef.current!.getContext("2d")!.clearRect(0, 0, 400, 150)} className="text-sm text-red-500 hover:underline">Clear</button>
        <p className="text-sm font-medium">Step 2 - Upload PDF:</p>
        <input type="file" accept=".pdf" onChange={e => e.target.files?.[0] && loadPdf(e.target.files[0])} className="block w-full border rounded p-2" />
        {pages > 0 && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <label className="flex flex-col font-medium">Page <input type="number" min={1} max={pages} value={page} onChange={e => setPage(+e.target.value)} className="border rounded p-1 mt-1" /></label>
            <label className="flex flex-col font-medium">Width (pts) <input type="number" min={50} value={w} onChange={e => setW(+e.target.value)} className="border rounded p-1 mt-1" /></label>
            <label className="flex flex-col font-medium">X (pts) <input type="number" min={0} value={x} onChange={e => setX(+e.target.value)} className="border rounded p-1 mt-1" /></label>
            <label className="flex flex-col font-medium">Y from top <input type="number" min={0} value={y} onChange={e => setY(+e.target.value)} className="border rounded p-1 mt-1" /></label>
            <button onClick={embed} className="col-span-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Embed Signature</button>
          </div>
        )}
        {status && <p className="text-sm text-gray-500">{status}</p>}
        {url && <a href={url} download="signed.pdf" className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Download Signed PDF</a>}
      </div>
    </ToolLayout>
  );
}
