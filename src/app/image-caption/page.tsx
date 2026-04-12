import type { Metadata } from "next";
import Client from "./Client";
export const metadata: Metadata = {
  title: "AI Image Caption Generator Online Free — Describe Any Image | FreeTools.lk",
  description: "Upload any image and AI will describe what's in it. Great for alt text, accessibility, and content creation.",
  keywords: ["image caption", "image description", "AI caption generator", "alt text generator"],
};
export default function Page() { return <Client />; }
