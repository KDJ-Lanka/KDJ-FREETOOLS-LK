import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Rotate PDF Online Free — Fix PDF Orientation",
  description: "Rotate PDF pages to the correct orientation. Free, instant, no sign-up required.",
  openGraph: { title: "Rotate PDF Online Free — Fix PDF Orientation", description: "Rotate PDF pages to the correct orientation. Free, instant, no sign-up required.", url: "https://freetools.lk/rotate-pdf", type: "website" },
  twitter: { card: "summary", title: "Rotate PDF Online Free — Fix PDF Orientation", description: "Rotate PDF pages to the correct orientation. Free, instant, no sign-up required." },
  alternates: { canonical: "https://freetools.lk/rotate-pdf" },
};

export default function Page() {
  return <Client />;
}