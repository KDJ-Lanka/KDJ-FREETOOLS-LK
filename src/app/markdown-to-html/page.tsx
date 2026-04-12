import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Markdown to HTML Online Free — Convert MD to HTML",
  description: "Convert Markdown text to a clean standalone HTML document instantly. Free, no sign-up, runs entirely in your browser. 100% private.",
  openGraph: { title: "Markdown to HTML Online Free", description: "Convert Markdown to HTML instantly. Free, browser-based, no uploads.", url: "https://freetools.lk/markdown-to-html", type: "website" },
  twitter: { card: "summary", title: "Markdown to HTML Online Free", description: "Convert Markdown to HTML instantly. Free, browser-based, no uploads." },
  alternates: { canonical: "https://freetools.lk/markdown-to-html" },
};

export default function Page() {
  return <Client />;
}
