import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Video Speed Changer Online Free — Slow Motion & Fast Forward | FreeTools.lk",
  description: "Change video playback speed from 0.25x to 4x. Audio pitch preserved. Runs in your browser.",
  keywords: ["video speed","slow motion","fast forward"],
};

export default function Page() { return <Client />; }
