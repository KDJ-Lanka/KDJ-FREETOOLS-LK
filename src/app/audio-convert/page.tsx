import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Convert Audio Online Free — MP3 WAV AAC OGG FLAC Converter | FreeTools.lk",
  description: "Convert audio between MP3, WAV, AAC, OGG, FLAC and M4A formats. Browser-based.",
  keywords: ["convert audio","audio converter","mp3 converter"],
};

export default function Page() { return <Client />; }
