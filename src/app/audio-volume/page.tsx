import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Adjust Audio Volume Online Free — Boost or Reduce Volume | FreeTools.lk",
  description: "Boost or reduce audio volume by any factor. Runs in your browser.",
  keywords: ["adjust volume","boost audio","audio volume"],
};

export default function Page() { return <Client />; }
