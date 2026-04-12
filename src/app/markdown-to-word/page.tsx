import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Markdown to Word Online Free — Convert MD to DOCX",
  description: "Convert Markdown text to a formatted .docx Word document instantly. Free, no sign-up, runs entirely in your browser. 100% private.",
  openGraph: { title: "Markdown to Word Online Free", description: "Convert Markdown to DOCX instantly. Free, browser-based, no uploads.", url: "https://freetools.lk/markdown-to-word", type: "website" },
  twitter: { card: "summary", title: "Markdown to Word Online Free", description: "Convert Markdown to DOCX instantly. Free, browser-based, no uploads." },
  alternates: { canonical: "https://freetools.lk/markdown-to-word" },
};

export default function Page() {
  return <Client />;
}
