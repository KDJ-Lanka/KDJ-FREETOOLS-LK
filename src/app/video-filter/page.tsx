import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Video Color Filter Online Free — Grayscale Sepia Vintage | FreeTools.lk",
  description: "Apply grayscale, sepia, vintage, vivid, cool or warm color filters to your video.",
  keywords: ["video filter","grayscale video","sepia video"],
};

export default function Page() { return <Client />; }
