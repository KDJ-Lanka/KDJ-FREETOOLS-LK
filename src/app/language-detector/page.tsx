import type { Metadata } from "next";
import Client from "./Client";
export const metadata: Metadata = {
  title: "Language Detector Online Free — Detect Text Language Instantly | FreeTools.lk",
  description: "Instantly identify the language of any text. Supports 20+ languages. AI-powered, runs in your browser.",
  keywords: ["language detector", "detect language", "language identification", "NLP"],
};
export default function Page() { return <Client />; }
