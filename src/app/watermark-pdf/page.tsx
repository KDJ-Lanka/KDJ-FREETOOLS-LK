import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Watermark PDF Online Free — Add Text Watermark",
  description: "Add a custom text watermark to every page of your PDF. Free, private, no upload needed.",
  openGraph: { title: "Watermark PDF Online Free — Add Text Watermark", description: "Add a custom text watermark to every page of your PDF. Free, private, no upload needed.", url: "https://freetools.lk/watermark-pdf", type: "website" },
  twitter: { card: "summary", title: "Watermark PDF Online Free — Add Text Watermark", description: "Add a custom text watermark to every page of your PDF. Free, private, no upload needed." },
  alternates: { canonical: "https://freetools.lk/watermark-pdf" },
};

export default function Page() {
  return <Client />;
}