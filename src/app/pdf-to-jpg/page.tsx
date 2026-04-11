import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "PDF to JPG Online Free — Convert PDF Pages to Images",
  description: "Convert PDF pages to high-quality JPG images instantly. Free, no sign-up, 100% private.",
  openGraph: { title: "PDF to JPG Online Free — Convert PDF Pages to Images", description: "Convert PDF pages to high-quality JPG images instantly. Free, no sign-up, 100% private.", url: "https://freetools.lk/pdf-to-jpg", type: "website" },
  twitter: { card: "summary", title: "PDF to JPG Online Free — Convert PDF Pages to Images", description: "Convert PDF pages to high-quality JPG images instantly. Free, no sign-up, 100% private." },
  alternates: { canonical: "https://freetools.lk/pdf-to-jpg" },
};

export default function Page() {
  return <Client />;
}