import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Trim Video Online Free — Cut Video Clips",
  description: "Trim your video by setting a start and end point. Free online video cutter — no sign-up.",
  openGraph: { title: "Trim Video Online Free — Cut Video Clips", description: "Trim your video by setting a start and end point. Free online video cutter — no sign-up.", url: "https://freetools.lk/trim-video", type: "website" },
  twitter: { card: "summary", title: "Trim Video Online Free — Cut Video Clips", description: "Trim your video by setting a start and end point. Free online video cutter — no sign-up." },
  alternates: { canonical: "https://freetools.lk/trim-video" },
};

export default function Page() {
  return <Client />;
}