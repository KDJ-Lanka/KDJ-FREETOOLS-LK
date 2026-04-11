// Copies mupdf WASM dist files to public/mupdf/ so they can be loaded
// as static assets in the browser (bypasses bundler for large WASM file).
import { cpSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = resolve(__dirname, "../node_modules/mupdf/dist");
const dest = resolve(__dirname, "../public/mupdf");

mkdirSync(dest, { recursive: true });
["mupdf.js", "mupdf-wasm.js", "mupdf-wasm.wasm"].forEach((f) => {
  cpSync(resolve(src, f), resolve(dest, f));
});
console.log("✓ mupdf WASM files copied to public/mupdf/");

// Also copy imagemagick WASM
const imSrc = resolve(__dirname, "../node_modules/@imagemagick/magick-wasm/dist");
const imDest = resolve(__dirname, "../public/imagemagick");
mkdirSync(imDest, { recursive: true });
["magick.wasm"].forEach((f) => {
  const srcFile = resolve(imSrc, f);
  const destFile = resolve(imDest, f);
  if (existsSync(srcFile)) {
    cpSync(srcFile, destFile);
    console.log(`✓ Copied ${f} to public/imagemagick/`);
  }
});
