import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Word to HTML Online Free — Convert DOCX to HTML",
  description: "Upload a .docx Word document and convert it to a standalone HTML file instantly. Free, no sign-up, runs entirely in your browser. 100% private.",
  openGraph: { title: "Word to HTML Online Free", description: "Convert DOCX to HTML instantly. Free, browser-based, no uploads.", url: "https://freetools.lk/word-to-html", type: "website" },
  twitter: { card: "summary", title: "Word to HTML Online Free", description: "Convert DOCX to HTML instantly. Free, browser-based, no uploads." },
  alternates: { canonical: "https://freetools.lk/word-to-html" },
};

export default function Page() {
  return <Client />;
}
