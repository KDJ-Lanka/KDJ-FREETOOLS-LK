import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Compress PDF Online Free — Reduce PDF Size",
  description: "Reduce PDF file size without losing quality. Free PDF compressor — no sign-up, runs in your browser.",
  openGraph: { title: "Compress PDF Online Free — Reduce PDF Size", description: "Reduce PDF file size without losing quality. Free PDF compressor — no sign-up, runs in your browser.", url: "https://freetools.lk/compress-pdf", type: "website" },
  twitter: { card: "summary", title: "Compress PDF Online Free — Reduce PDF Size", description: "Reduce PDF file size without losing quality. Free PDF compressor — no sign-up, runs in your browser." },
  alternates: { canonical: "https://freetools.lk/compress-pdf" },
};

export default function Page() {
  return <Client />;
}