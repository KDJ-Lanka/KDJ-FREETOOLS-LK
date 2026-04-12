import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Word to Markdown Online Free — Convert DOCX to MD",
  description: "Upload a .docx Word file and get clean Markdown text instantly. Free, no sign-up, runs entirely in your browser. 100% private.",
  openGraph: { title: "Word to Markdown Online Free", description: "Convert DOCX to Markdown instantly. Free, browser-based, no uploads.", url: "https://freetools.lk/word-to-markdown", type: "website" },
  twitter: { card: "summary", title: "Word to Markdown Online Free", description: "Convert DOCX to Markdown instantly. Free, browser-based, no uploads." },
  alternates: { canonical: "https://freetools.lk/word-to-markdown" },
};

export default function Page() {
  return <Client />;
}
