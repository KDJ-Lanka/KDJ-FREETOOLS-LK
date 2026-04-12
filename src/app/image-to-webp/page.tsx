import type { Metadata } from "next";
import Client from "./Client";
export const metadata: Metadata = {
  title: "Image to WebP/AVIF Converter — Convert Images Online Free | FreeTools.lk",
  description: "Convert images to modern WebP or AVIF format in your browser. No uploads — 100% private.",
};
export default function Page() { return <Client />; }
