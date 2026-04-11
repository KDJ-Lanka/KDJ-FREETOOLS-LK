import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Resize Image Online Free — Change Image Dimensions",
  description: "Resize images to exact dimensions or by percentage. Free, no sign-up, works in your browser.",
  openGraph: { title: "Resize Image Online Free — Change Image Dimensions", description: "Resize images to exact dimensions or by percentage. Free, no sign-up, works in your browser.", url: "https://freetools.lk/resize-image", type: "website" },
  twitter: { card: "summary", title: "Resize Image Online Free — Change Image Dimensions", description: "Resize images to exact dimensions or by percentage. Free, no sign-up, works in your browser." },
  alternates: { canonical: "https://freetools.lk/resize-image" },
};

export default function Page() {
  return <Client />;
}