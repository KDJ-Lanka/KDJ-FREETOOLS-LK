import type { Metadata } from "next";
import Client from "./Client";
export const metadata: Metadata = {
  title: "AI Image Upscaler Online Free — Upscale Image 2x 4x | FreeTools.lk",
  description: "Enlarge and enhance images 2x or 4x with AI super resolution. Runs entirely in your browser.",
  keywords: ["image upscaler", "upscale image", "AI upscaler", "super resolution"],
};
export default function Page() { return <Client />; }
