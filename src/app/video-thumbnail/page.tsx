import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Video Thumbnail Extractor Online Free — Extract Frame as JPEG | FreeTools.lk",
  description: "Extract any frame from a video as a high-quality JPEG image.",
  keywords: ["video thumbnail","extract frame","video screenshot"],
};

export default function Page() { return <Client />; }
