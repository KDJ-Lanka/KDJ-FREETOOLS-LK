import type { Metadata } from "next";
import Client from "./Client";
export const metadata: Metadata = {
  title: "E-Signature Maker — Draw Digital Signature Online Free | FreeTools.lk",
  description: "Draw and export your digital signature as PNG. Free, browser-only, no signup required.",
};
export default function Page() { return <Client />; }
