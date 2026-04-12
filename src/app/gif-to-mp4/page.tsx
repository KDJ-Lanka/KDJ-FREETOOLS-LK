import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "GIF to MP4 Online Free — Convert Animated GIF to Video | FreeTools.lk",
  description: "Convert an animated GIF into a compact, shareable MP4 video. Runs in your browser.",
  keywords: ["gif to mp4","convert gif","animated gif"],
};

export default function Page() { return <Client />; }
