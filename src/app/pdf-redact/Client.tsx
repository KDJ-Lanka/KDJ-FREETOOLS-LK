"use client";
import { useRef, useState } from "react";
import ToolLayout from "@/components/ToolLayout";

export default function Client() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [curPage, setCurPage] = useState(1);
  const [pageSize, setPageSize] = useState<{ w: number; h: number } | null>(null);
  const [boxes, setBoxes] = useState<{ x: number; y: number; w: number; h: number }[]>([]);
  const [drawing, setDrawing] = useState(false);
  const startPt = useRef<{ x: number; y: number } | null>(null);
  const [status, setStatus] = useState("");
  const [url, setUrl] = useState<string | null>(null);

  function canvasPt(e: React.MouseEvent) {
    const c = canvasRef.current!; const r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
  }

  async function loadPage(pdfBuf: Uint8Array, pg: number) {
    // @ts-ignore
    const mupdf = await import(/* webpackIgnore: true */ "/mupdf/mupdf.js");
    const mod = mupdf.default ?? mupdf;
    const doc = mod.Document.openDocument(pdfBuf, "application/pdf");
    const page = doc.loadPage(pg - 1);
    const bounds = page.getBounds();
    const w = bounds[2] - bounds[0], h = bounds[3] - bounds[1];
    const mat = mod.Matrix.scale(1.5, 1.5);
    const px = page.toPixmap(mat, mod.ColorSpace.DeviceRGB);
    const jpegRaw = px.asJPEG(90);
    const jpeg: Uint8Array = (jpegRaw instanceof Uint8Array ? jpegRaw : new Uint8Array(jpegRaw)).slice();
    px.destroy(); page.destroy(); doc.destroy();
    const canvas = canvasRef.current!;
    const imgEl = new Image();
    const blobUrl = URL.createObjectURL(new Blob([jpeg.buffer as ArrayBuffer], { type: "image/jpeg" }));
    imgEl.onload = () => {
      canvas.width = imgEl.width; canvas.height = imgEl.height;
      canvas.getContext("2d")!.drawImage(imgEl, 0, 0);
      URL.revokeObjectURL(blobUrl);
    };
    imgEl.src = blobUrl;
    setPageSize({ w, h });
    setBoxes([]);
  }

  async function loadPdf(file: File) {
    const buf = new Uint8Array(await file.arrayBuffer()); setBytes(buf); setUrl(null);
    const { PDFDocument } = await import("pdf-lib");
    const doc = await PDFDocument.load(buf);
    const n = doc.getPageCount(); setPageCount(n); setStatus(`${n} pages. Draw black boxes to redact.`);
    await loadPage(buf, 1);
  }

  function mouseDown(e: React.MouseEvent) { setDrawing(true); startPt.current = canvasPt(e); }
  function mouseUp(e: React.MouseEvent) {
    if (!drawing || !startPt.current) return;
    setDrawing(false);
    const end = canvasPt(e);
    const box = { x: Math.min(startPt.current.x, end.x), y: Math.min(startPt.current.y, end.y), w: Math.abs(end.x - startPt.current.x), h: Math.abs(end.y - startPt.current.y) };
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.fillStyle = "#000"; ctx.fillRect(box.x, box.y, box.w, box.h);
    setBoxes(b => [...b, box]);
  }

  async function applyRedactions() {
    if (!bytes || !pageSize) return;
    setStatus("Applying redactions...");
    const { PDFDocument, rgb } = await import("pdf-lib");
    const doc = await PDFDocument.load(bytes);
    const pg = doc.getPage(curPage - 1);
    const { width, height } = pg.getSize();
    const canvas = canvasRef.current!;
    const scaleX = width / (canvas.width / 1.5);
    const scaleY = height / (canvas.height / 1.5);
    for (const box of boxes) {
      pg.drawRectangle({
        x: box.x * scaleX / 1.5,
        y: height - (box.y * scaleY / 1.5) - (box.h * scaleY / 1.5),
        width: box.w * scaleX / 1.5,
        height: box.h * scaleY / 1.5,
        color: rgb(0, 0, 0),
      });
    }
    const out = await doc.save();
    setUrl(URL.createObjectURL(new Blob([out.buffer as ArrayBuffer], { type: "application/pdf" })));
    setStatus("Redaction applied!");
  }

  return (
    <ToolLayout>
      <div className="space-y-4">
        <input type="file" accept=".pdf" onChange={e => e.target.files?.[0] && loadPdf(e.target.files[0])} className="block w-full border rounded p-2" />
        {status && <p className="text-sm text-gray-500">{status}</p>}
        {pageCount > 0 && (
          <>
            <div className="flex gap-3 items-center text-sm">
              <label className="font-medium">Page:</label>
              <input type="number" min={1} max={pageCount} value={curPage} onChange={async e => { const p = +e.target.value; setCurPage(p); if (bytes) await loadPage(bytes, p); }} className="border rounded p-1 w-20" />
              <span className="text-gray-400">of {pageCount} - drag to draw black box</span>
            </div>
            <canvas ref={canvasRef} style={{ border: "1px solid #ccc", borderRadius: 8, cursor: "crosshair", width: "100%" }}
              onMouseDown={mouseDown} onMouseUp={mouseUp} />
            <div className="flex gap-3">
              <button onClick={applyRedactions} className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-black">Apply Redactions</button>
              <button onClick={() => { if (bytes) loadPage(bytes, curPage); }} className="border px-4 py-2 rounded hover:bg-gray-50">Reset Page</button>
            </div>
          </>
        )}
        {url && <a href={url} download="redacted.pdf" className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Download Redacted PDF</a>}
      </div>
    </ToolLayout>
  );
}
