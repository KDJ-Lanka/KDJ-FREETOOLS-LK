"use client";
import { useRef, useState } from "react";

export default function Client() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(3);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    setDrawing(true);
    lastPos.current = getPos(e);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing) return;
    e.preventDefault();
    const ctx = canvasRef.current!.getContext("2d")!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(lastPos.current!.x, lastPos.current!.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  }

  function stopDraw() {
    setDrawing(false);
    lastPos.current = null;
  }

  function clear() {
    const canvas = canvasRef.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setOutputUrl(null);
  }

  function exportPNG() {
    canvasRef.current!.toBlob(blob => {
      if (blob) setOutputUrl(URL.createObjectURL(blob));
    });
  }

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">✍️</span>
            <h1 className="text-2xl sm:text-3xl font-black">E-Signature Maker</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400">
            Draw your digital signature and export it as a transparent PNG. Fully browser-based.
          </p>
        </div>
        <div className="space-y-4">
          <div className="flex gap-4 items-center flex-wrap">
            <label className="text-sm font-medium">Color:</label>
            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
            <label className="text-sm font-medium">Thickness: {lineWidth}px</label>
            <input
              type="range"
              min={1}
              max={10}
              value={lineWidth}
              onChange={e => setLineWidth(+e.target.value)}
              className="w-32"
            />
            <button
              onClick={clear}
              className="px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 text-red-600 text-sm font-medium"
            >
              Clear
            </button>
          </div>
          <canvas
            ref={canvasRef}
            width={800}
            height={300}
            style={{ touchAction: "none", cursor: "crosshair", border: "1px solid #e2e8f0", borderRadius: 12, width: "100%", background: "#fff" }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />
          <div className="flex gap-3">
            <button
              onClick={exportPNG}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 font-semibold text-sm"
            >
              Export PNG
            </button>
          </div>
          {outputUrl && (
            <a
              href={outputUrl}
              download="signature.png"
              className="inline-block bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 font-semibold text-sm"
            >
              Download Signature
            </a>
          )}
        </div>
      </main>
  );
}
