import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Trim Audio Online Free — Cut Audio File | FreeTools.lk",
  description: "Cut your audio file by setting start and end points. Runs entirely in your browser.",
  keywords: ["trim audio","cut audio","audio cutter"],
};

export default function Page() { return <Client />; }
