import type { Metadata } from "next";
import Client from "./Client";
export const metadata: Metadata = {
  title: "Face Blur Online Free — Auto Blur Faces in Photos | FreeTools.lk",
  description: "Automatically detect and blur faces in photos to protect privacy. AI-powered, runs entirely in your browser.",
  keywords: ["face blur", "blur faces", "privacy", "AI face detection"],
};
export default function Page() { return <Client />; }
