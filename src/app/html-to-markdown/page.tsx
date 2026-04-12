import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "HTML to Markdown Online Free — Convert HTML to MD",
  description: "Convert HTML content to clean Markdown text instantly. Free, no sign-up, runs entirely in your browser. 100% private.",
  openGraph: { title: "HTML to Markdown Online Free", description: "Convert HTML to Markdown instantly. Free, browser-based, no uploads.", url: "https://freetools.lk/html-to-markdown", type: "website" },
  twitter: { card: "summary", title: "HTML to Markdown Online Free", description: "Convert HTML to Markdown instantly. Free, browser-based, no uploads." },
  alternates: { canonical: "https://freetools.lk/html-to-markdown" },
};

export default function Page() {
  return <Client />;
}
