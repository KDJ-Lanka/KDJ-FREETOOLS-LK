import type { Metadata } from "next";
import Client from "./Client";
export const metadata: Metadata = {
  title: "QR Code Scanner — Decode QR Codes from Images Free | FreeTools.lk",
  description: "Scan and decode QR codes from images instantly. Runs in your browser — no uploads needed.",
};
export default function Page() { return <Client />; }
