import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Extract Audio from Video Online Free — MP3 WAV AAC",
  description: "Extract the audio track from any video as MP3, WAV or AAC. Free, no sign-up, 100% private.",
  openGraph: { title: "Extract Audio from Video Online Free — MP3 WAV AAC", description: "Extract the audio track from any video as MP3, WAV or AAC. Free, no sign-up, 100% private.", url: "https://freetools.lk/extract-audio", type: "website" },
  twitter: { card: "summary", title: "Extract Audio from Video Online Free — MP3 WAV AAC", description: "Extract the audio track from any video as MP3, WAV or AAC. Free, no sign-up, 100% private." },
  alternates: { canonical: "https://freetools.lk/extract-audio" },
};

export default function Page() {
  return <Client />;
}