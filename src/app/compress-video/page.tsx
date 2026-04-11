import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Compress Video Online Free — Reduce Video File Size",
  description: "Reduce video file size while preserving quality. Free online video compressor — no sign-up, 100% private.",
  openGraph: { title: "Compress Video Online Free — Reduce Video File Size", description: "Reduce video file size while preserving quality. Free online video compressor — no sign-up, 100% private.", url: "https://freetools.lk/compress-video", type: "website" },
  twitter: { card: "summary", title: "Compress Video Online Free — Reduce Video File Size", description: "Reduce video file size while preserving quality. Free online video compressor — no sign-up, 100% private." },
  alternates: { canonical: "https://freetools.lk/compress-video" },
};

export default function Page() {
  return <Client />;
}