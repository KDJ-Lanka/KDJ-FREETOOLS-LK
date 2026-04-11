import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Rotate and Flip Image Online Free",
  description: "Rotate images 90, 180, 270 degrees or flip horizontally or vertically. Free, instant, no sign-up.",
  openGraph: { title: "Rotate and Flip Image Online Free", description: "Rotate images 90, 180, 270 degrees or flip horizontally or vertically. Free, instant, no sign-up.", url: "https://freetools.lk/rotate-image", type: "website" },
  twitter: { card: "summary", title: "Rotate and Flip Image Online Free", description: "Rotate images 90, 180, 270 degrees or flip horizontally or vertically. Free, instant, no sign-up." },
  alternates: { canonical: "https://freetools.lk/rotate-image" },
};

export default function Page() {
  return <Client />;
}