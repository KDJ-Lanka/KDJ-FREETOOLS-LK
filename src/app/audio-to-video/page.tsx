import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Audio to Video Online Free — Create Video from Audio and Image | FreeTools.lk",
  description: "Combine audio with a cover image to create a shareable MP4 video.",
  keywords: ["audio to video","audio video","cover image"],
};

export default function Page() { return <Client />; }
