import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Subtitle Generator Online Free — Auto-Generate SRT VTT Subtitles",
  description: "Automatically generate subtitles from any video or audio file. Download as SRT, VTT or plain text. Free, no sign-up, runs entirely in your browser.",
  keywords: ["subtitle generator", "auto subtitles", "srt generator", "vtt subtitles", "video transcription", "free subtitle maker", "speech to text"],
  openGraph: {
    title: "Subtitle Generator — Auto-Generate SRT & VTT Subtitles Free",
    description: "Upload a video or audio file and get subtitles instantly. Download SRT, VTT or plain text. 100% free and private.",
    url: "https://freetools.lk/subtitle-generator",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Subtitle Generator — Free Online Tool",
    description: "Auto-generate subtitles from video/audio. Download SRT, VTT or TXT. Free, private, no sign-up.",
  },
  alternates: { canonical: "https://freetools.lk/subtitle-generator" },
};

export default function Page() {
  return <Client />;
}
