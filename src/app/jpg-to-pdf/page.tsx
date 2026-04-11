import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "JPG to PDF Online Free — Convert Images to PDF",
  description: "Turn JPG, PNG or any image into a PDF document instantly. Free, no sign-up.",
  openGraph: { title: "JPG to PDF Online Free — Convert Images to PDF", description: "Turn JPG, PNG or any image into a PDF document instantly. Free, no sign-up.", url: "https://freetools.lk/jpg-to-pdf", type: "website" },
  twitter: { card: "summary", title: "JPG to PDF Online Free — Convert Images to PDF", description: "Turn JPG, PNG or any image into a PDF document instantly. Free, no sign-up." },
  alternates: { canonical: "https://freetools.lk/jpg-to-pdf" },
};

export default function Page() {
  return <Client />;
}