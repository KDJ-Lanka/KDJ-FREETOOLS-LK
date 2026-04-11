import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Watermark Image Online Free — Add Text Watermark",
  description: "Add a text watermark to your images to protect them. Free, instant, no sign-up.",
  openGraph: { title: "Watermark Image Online Free — Add Text Watermark", description: "Add a text watermark to your images to protect them. Free, instant, no sign-up.", url: "https://freetools.lk/watermark-image", type: "website" },
  twitter: { card: "summary", title: "Watermark Image Online Free — Add Text Watermark", description: "Add a text watermark to your images to protect them. Free, instant, no sign-up." },
  alternates: { canonical: "https://freetools.lk/watermark-image" },
};

export default function Page() {
  return <Client />;
}