// Lazy-loads pandoc-wasm — browser only
import type { PandocResult } from "pandoc-wasm";

type ConvertFn = (
  options: Record<string, unknown>,
  stdin: string | null,
  files: Record<string, string | Blob>
) => Promise<PandocResult>;

let _convert: ConvertFn | null = null;
let _loadPromise: Promise<ConvertFn> | null = null;

async function getConvert(): Promise<ConvertFn> {
  if (typeof window === "undefined") throw new Error("Pandoc only runs in browser");
  if (_convert) return _convert;
  if (!_loadPromise) {
    _loadPromise = import("pandoc-wasm").then((mod) => {
      _convert = mod.convert as ConvertFn;
      return _convert;
    });
  }
  return _loadPromise;
}

// ── Text ↔ Text helpers ──────────────────────────────────────────────────────

export async function pdMarkdownToHtml(markdown: string): Promise<string> {
  const convert = await getConvert();
  const result = await convert({ from: "markdown", to: "html", standalone: true }, markdown, {});
  return result.stdout;
}

export async function pdHtmlToMarkdown(html: string): Promise<string> {
  const convert = await getConvert();
  const result = await convert({ from: "html", to: "markdown" }, html, {});
  return result.stdout;
}

// ── Binary output helpers ────────────────────────────────────────────────────

export async function pdMarkdownToWord(markdown: string): Promise<Blob> {
  const convert = await getConvert();
  const result = await convert(
    { from: "markdown", to: "docx", "output-file": "output.docx" },
    markdown,
    {}
  );
  return result.files["output.docx"] as Blob;
}

export async function pdHtmlToWord(html: string): Promise<Blob> {
  const convert = await getConvert();
  const result = await convert(
    { from: "html", to: "docx", "output-file": "output.docx" },
    html,
    {}
  );
  return result.files["output.docx"] as Blob;
}

// ── Binary input helpers ─────────────────────────────────────────────────────

export async function pdWordToMarkdown(file: File): Promise<string> {
  const convert = await getConvert();
  const blob = new Blob([await file.arrayBuffer()], { type: file.type });
  const result = await convert(
    { from: "docx", to: "markdown", "input-files": ["input.docx"] },
    null,
    { "input.docx": blob }
  );
  return result.stdout;
}

export async function pdWordToHtml(file: File): Promise<string> {
  const convert = await getConvert();
  const blob = new Blob([await file.arrayBuffer()], { type: file.type });
  const result = await convert(
    { from: "docx", to: "html", standalone: true, "input-files": ["input.docx"] },
    null,
    { "input.docx": blob }
  );
  return result.stdout;
}

// ── Download helper ──────────────────────────────────────────────────────────

export function triggerDocDownload(content: string | Blob, filename: string, mime?: string) {
  const blob =
    content instanceof Blob ? content : new Blob([content], { type: mime ?? "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
