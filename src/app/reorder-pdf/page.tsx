import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Reorder PDF Pages Online Free — Rearrange PDF",
  description: "Drag and drop to rearrange PDF pages in any order. Free, instant, no sign-up.",
  openGraph: { title: "Reorder PDF Pages Online Free — Rearrange PDF", description: "Drag and drop to rearrange PDF pages in any order. Free, instant, no sign-up.", url: "https://freetools.lk/reorder-pdf", type: "website" },
  twitter: { card: "summary", title: "Reorder PDF Pages Online Free — Rearrange PDF", description: "Drag and drop to rearrange PDF pages in any order. Free, instant, no sign-up." },
  alternates: { canonical: "https://freetools.lk/reorder-pdf" },
};

export default function Page() {
  return <Client />;
}