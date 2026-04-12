import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "HTML to Word Online Free — Convert HTML to DOCX",
  description: "Convert HTML content into a downloadable .docx Word document instantly. Free, no sign-up, runs entirely in your browser. 100% private.",
  openGraph: { title: "HTML to Word Online Free", description: "Convert HTML to DOCX instantly. Free, browser-based, no uploads.", url: "https://freetools.lk/html-to-word", type: "website" },
  twitter: { card: "summary", title: "HTML to Word Online Free", description: "Convert HTML to DOCX instantly. Free, browser-based, no uploads." },
  alternates: { canonical: "https://freetools.lk/html-to-word" },
};

export default function Page() {
  return <Client />;
}
