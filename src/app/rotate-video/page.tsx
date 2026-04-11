import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Rotate Video Online Free — Flip and Rotate Video",
  description: "Rotate or flip your video — 90, 180 degrees or mirror. Free, no sign-up, runs in your browser.",
  openGraph: { title: "Rotate Video Online Free — Flip and Rotate Video", description: "Rotate or flip your video — 90, 180 degrees or mirror. Free, no sign-up, runs in your browser.", url: "https://freetools.lk/rotate-video", type: "website" },
  twitter: { card: "summary", title: "Rotate Video Online Free — Flip and Rotate Video", description: "Rotate or flip your video — 90, 180 degrees or mirror. Free, no sign-up, runs in your browser." },
  alternates: { canonical: "https://freetools.lk/rotate-video" },
};

export default function Page() {
  return <Client />;
}