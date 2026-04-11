// Lazy-loads mupdf WASM from /public/mupdf/ — only runs in browser

/* eslint-disable @typescript-eslint/no-explicit-any */

let _mupdf: any = null;

// Load mupdf via URL so the bundler never tries to resolve the bare specifier.
// Files are served from public/mupdf/ (copied from node_modules/mupdf/dist/).
async function getMupdf(): Promise<any> {
  if (typeof window === "undefined") throw new Error("WASM only runs in browser");
  if (_mupdf) return _mupdf;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore – mupdf.js is a runtime-only file served from /public/mupdf/
  const mod = await import(/* webpackIgnore: true */ "/mupdf/mupdf.js");
  _mupdf = mod.default ?? mod;
  return _mupdf;
}

export async function mupdfProtect(
  pdfBytes: Uint8Array,
  userPassword: string,
  ownerPassword: string
): Promise<Uint8Array> {
  const mupdf = await getMupdf();
  const doc = mupdf.Document.openDocument(pdfBytes, "application/pdf");
  const ownerPwd = ownerPassword.trim() || userPassword;
  const buf = doc.saveToBuffer(
    `encrypt=aes-256,user-password=${userPassword},owner-password=${ownerPwd},compress`
  );
  doc.destroy();
  // Slice to get a clean standalone copy (not a view into WASM memory)
  const raw = buf.asUint8Array();
  return raw.slice();
}

export async function mupdfUnlock(
  pdfBytes: Uint8Array,
  password: string
): Promise<Uint8Array> {
  const mupdf = await getMupdf();
  const doc = mupdf.Document.openDocument(pdfBytes, "application/pdf");
  if (doc.needsPassword()) {
    const result = doc.authenticatePassword(password);
    if (result === 0) throw new Error("Incorrect password. Please check and try again.");
  }
  // encrypt=none explicitly strips all encryption from the saved file
  const buf = doc.saveToBuffer("encrypt=none,compress,garbage=4");
  doc.destroy();
  const raw = buf.asUint8Array();
  return raw.slice();
}

export async function mupdfCompress(pdfBytes: Uint8Array): Promise<Uint8Array> {
  const mupdf = await getMupdf();
  const doc = mupdf.Document.openDocument(pdfBytes, "application/pdf");
  const buf = doc.saveToBuffer("compress,compress-images,compress-fonts,garbage=4,clean");
  doc.destroy();
  return buf.asUint8Array();
}

export async function mupdfExtractText(pdfBytes: Uint8Array): Promise<string> {
  const mupdf = await getMupdf();
  const doc = mupdf.Document.openDocument(pdfBytes, "application/pdf");
  const pageCount = doc.countPages();
  const lines: string[] = [];
  for (let i = 0; i < pageCount; i++) {
    const page = doc.loadPage(i);
    const st = page.toStructuredText("preserve-whitespace");
    lines.push(`--- Page ${i + 1} ---`);
    lines.push(st.asText());
    page.destroy();
  }
  doc.destroy();
  return lines.join("\n");
}

// Renders each page as a gray JPEG using mupdf, then reassembles with pdf-lib.
// Returns PDF bytes.
export async function mupdfToGrayscale(pdfBytes: Uint8Array): Promise<Uint8Array> {
  const mupdf = await getMupdf();
  const { PDFDocument } = await import("pdf-lib");

  const srcDoc = mupdf.Document.openDocument(pdfBytes, "application/pdf");
  const outDoc = await PDFDocument.create();
  const pageCount = srcDoc.countPages();
  const scale = 150 / 72;

  for (let i = 0; i < pageCount; i++) {
    const page = srcDoc.loadPage(i);
    const bounds = page.getBounds();
    const wPts = bounds[2] - bounds[0];
    const hPts = bounds[3] - bounds[1];

    const matrix = mupdf.Matrix.scale(scale, scale);
    const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceGray);
    const jpegBytes: Uint8Array = pixmap.asJPEG(85);

    const embeddedImg = await outDoc.embedJpg(jpegBytes);
    const pdfPage = outDoc.addPage([wPts, hPts]);
    pdfPage.drawImage(embeddedImg, { x: 0, y: 0, width: wPts, height: hPts });

    pixmap.destroy();
    page.destroy();
  }

  srcDoc.destroy();
  const saved = await outDoc.save();
  return saved;
}

export async function mupdfRenderPage(
  pdfBytes: Uint8Array,
  pageIndex: number,
  dpi = 150
): Promise<Uint8Array> {
  const mupdf = await getMupdf();
  const doc = mupdf.Document.openDocument(pdfBytes, "application/pdf");
  const page = doc.loadPage(pageIndex);
  const matrix = mupdf.Matrix.scale(dpi / 72, dpi / 72);
  const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB);
  const jpeg = pixmap.asJPEG(90);
  pixmap.destroy();
  page.destroy();
  doc.destroy();
  return jpeg instanceof Uint8Array ? jpeg.slice() : new Uint8Array(jpeg);
}
