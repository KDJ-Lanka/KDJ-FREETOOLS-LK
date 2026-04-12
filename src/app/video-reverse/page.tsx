import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Reverse Video Online Free — Play Video Backwards | FreeTools.lk",
  description: "Reverse any video and play it backwards. No upload needed — runs in your browser.",
  keywords: ["reverse video","play backwards","video reverse"],
};

export default function Page() { return <Client />; }
