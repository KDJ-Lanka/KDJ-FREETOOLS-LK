import type { Metadata } from "next";
import Client from "./Client";
export const metadata: Metadata = {
  title: "AI Object Detector Online Free — Detect Objects in Photos | FreeTools.lk",
  description: "Upload any photo and AI will detect and label all objects with colored bounding boxes. Runs in your browser.",
  keywords: ["object detection", "AI object detector", "image recognition", "bounding boxes"],
};
export default function Page() { return <Client />; }
