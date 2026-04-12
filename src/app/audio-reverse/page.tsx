import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Reverse Audio Online Free — Play Audio Backwards | FreeTools.lk",
  description: "Reverse any audio file and play it backwards. Runs in your browser.",
  keywords: ["reverse audio","audio backwards","audio reverse"],
};

export default function Page() { return <Client />; }
