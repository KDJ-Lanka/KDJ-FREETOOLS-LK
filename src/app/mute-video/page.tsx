import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Mute Video Online Free — Remove Audio from Video",
  description: "Remove the audio track from your video in one click. Free, instant, no sign-up.",
  openGraph: { title: "Mute Video Online Free — Remove Audio from Video", description: "Remove the audio track from your video in one click. Free, instant, no sign-up.", url: "https://freetools.lk/mute-video", type: "website" },
  twitter: { card: "summary", title: "Mute Video Online Free — Remove Audio from Video", description: "Remove the audio track from your video in one click. Free, instant, no sign-up." },
  alternates: { canonical: "https://freetools.lk/mute-video" },
};

export default function Page() {
  return <Client />;
}