import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Crop Video Online Free — Crop to 1:1 9:16 16:9 | FreeTools.lk",
  description: "Crop video to 1:1, 16:9, 9:16, 4:3, or 3:4 aspect ratio. Browser-based, no upload.",
  keywords: ["crop video","aspect ratio","video crop"],
};

export default function Page() { return <Client />; }
