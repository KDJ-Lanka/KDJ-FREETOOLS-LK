import type { Metadata } from "next";
import Client from "./Client";
export const metadata: Metadata = {
  title: "Image to Text (OCR) — Extract Text from Images Online Free | FreeTools.lk",
  description: "Extract text from images using Tesseract.js OCR. Runs entirely in your browser — no uploads needed.",
};
export default function Page() { return <Client />; }
