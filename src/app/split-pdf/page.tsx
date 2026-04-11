import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Split PDF Online Free — Extract PDF Pages",
  description: "Split a PDF into separate files or extract specific pages. Free, no sign-up, works in your browser.",
  openGraph: { title: "Split PDF Online Free — Extract PDF Pages", description: "Split a PDF into separate files or extract specific pages. Free, no sign-up, works in your browser.", url: "https://freetools.lk/split-pdf", type: "website" },
  twitter: { card: "summary", title: "Split PDF Online Free — Extract PDF Pages", description: "Split a PDF into separate files or extract specific pages. Free, no sign-up, works in your browser." },
  alternates: { canonical: "https://freetools.lk/split-pdf" },
};

export default function Page() {
  return <Client />;
}