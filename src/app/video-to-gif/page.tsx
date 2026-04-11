import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Video to GIF Online Free — Convert Video to Animated GIF",
  description: "Convert a short video clip into an animated GIF. Free, no sign-up, runs in your browser.",
  openGraph: { title: "Video to GIF Online Free — Convert Video to Animated GIF", description: "Convert a short video clip into an animated GIF. Free, no sign-up, runs in your browser.", url: "https://freetools.lk/video-to-gif", type: "website" },
  twitter: { card: "summary", title: "Video to GIF Online Free — Convert Video to Animated GIF", description: "Convert a short video clip into an animated GIF. Free, no sign-up, runs in your browser." },
  alternates: { canonical: "https://freetools.lk/video-to-gif" },
};

export default function Page() {
  return <Client />;
}