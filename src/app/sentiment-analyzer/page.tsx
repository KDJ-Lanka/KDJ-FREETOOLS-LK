import type { Metadata } from "next";
import Client from "./Client";
export const metadata: Metadata = {
  title: "Sentiment Analyzer Online Free — Analyze Text Emotion | FreeTools.lk",
  description: "Detect the emotional tone of any text — positive, negative or neutral. Powered by AI, runs in your browser.",
  keywords: ["sentiment analyzer", "sentiment analysis", "emotion detection", "text analysis"],
};
export default function Page() { return <Client />; }
