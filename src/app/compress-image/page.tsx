import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Compress Image Online Free — Reduce Image File Size",
  description: "Reduce image file size while keeping great quality. Free image compressor — JPG, PNG, WebP. No sign-up.",
  openGraph: { title: "Compress Image Online Free — Reduce Image File Size", description: "Reduce image file size while keeping great quality. Free image compressor — JPG, PNG, WebP. No sign-up.", url: "https://freetools.lk/compress-image", type: "website" },
  twitter: { card: "summary", title: "Compress Image Online Free — Reduce Image File Size", description: "Reduce image file size while keeping great quality. Free image compressor — JPG, PNG, WebP. No sign-up." },
  alternates: { canonical: "https://freetools.lk/compress-image" },
};

export default function Page() {
  return <Client />;
}