import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "PDF to Text Online Free — Extract Text from PDF",
  description: "Extract all text content from your PDF instantly. Free, no sign-up, runs in your browser.",
  openGraph: { title: "PDF to Text Online Free — Extract Text from PDF", description: "Extract all text content from your PDF instantly. Free, no sign-up, runs in your browser.", url: "https://freetools.lk/pdf-to-text", type: "website" },
  twitter: { card: "summary", title: "PDF to Text Online Free — Extract Text from PDF", description: "Extract all text content from your PDF instantly. Free, no sign-up, runs in your browser." },
  alternates: { canonical: "https://freetools.lk/pdf-to-text" },
};

export default function Page() {
  return <Client />;
}