import type { Metadata } from "next";
import Client from "./Client";
export const metadata: Metadata = {
  title: "AI Background Remover Online Free — Remove Background Instantly | FreeTools.lk",
  description: "Remove image backgrounds instantly with AI. No signup required. Runs entirely in your browser — your photos never leave your device.",
  keywords: ["background remover", "remove background", "AI background removal", "transparent background"],
};
export default function Page() { return <Client />; }
