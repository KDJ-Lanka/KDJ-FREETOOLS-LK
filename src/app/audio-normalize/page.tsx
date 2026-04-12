import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Normalize Audio Online Free — Balance Audio Loudness | FreeTools.lk",
  description: "Auto-balance audio loudness to a consistent professional level using loudnorm.",
  keywords: ["normalize audio","loudness","audio normalize"],
};

export default function Page() { return <Client />; }
