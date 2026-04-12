import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Audio Fade In Out Online Free — Add Fade Effects to Audio | FreeTools.lk",
  description: "Add professional fade in and fade out effects to any audio file.",
  keywords: ["audio fade","fade in","fade out"],
};

export default function Page() { return <Client />; }
