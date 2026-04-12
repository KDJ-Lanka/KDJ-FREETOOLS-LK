import type { Metadata } from "next";
import Client from "./Client";
export const metadata: Metadata = {
  title: "AI Text Summarizer Online Free — Summarize Any Text Instantly | FreeTools.lk",
  description: "Paste any article, document or long text and get a concise summary in seconds. Runs in your browser.",
  keywords: ["text summarizer", "AI summarizer", "summarize text", "article summarizer"],
};
export default function Page() { return <Client />; }
