import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Merge PDF Online Free — Combine PDF Files",
  description: "Merge multiple PDF files into one document instantly. Free, no sign-up, runs entirely in your browser. 100% private.",
  openGraph: { title: "Merge PDF Online Free — Combine PDF Files", description: "Merge multiple PDF files into one document instantly. Free, no sign-up, runs entirely in your browser. 100% private.", url: "https://freetools.lk/merge-pdf", type: "website" },
  twitter: { card: "summary", title: "Merge PDF Online Free — Combine PDF Files", description: "Merge multiple PDF files into one document instantly. Free, no sign-up, runs entirely in your browser. 100% private." },
  alternates: { canonical: "https://freetools.lk/merge-pdf" },
};

export default function Page() {
  return <Client />;
}