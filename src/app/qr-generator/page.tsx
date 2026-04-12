import type { Metadata } from "next";
import Client from "./Client";
export const metadata: Metadata = {
  title: "QR Code Generator — Create QR Codes Free Online | FreeTools.lk",
  description: "Generate QR codes for URLs, text, and contacts instantly. Free, browser-only, no signup.",
};
export default function Page() { return <Client />; }
