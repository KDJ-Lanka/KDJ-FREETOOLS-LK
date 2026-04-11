import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Crop Image Online Free — Cut Image to Size",
  description: "Crop images to the exact size you need. Free online image cropper — no sign-up required.",
  openGraph: { title: "Crop Image Online Free — Cut Image to Size", description: "Crop images to the exact size you need. Free online image cropper — no sign-up required.", url: "https://freetools.lk/crop-image", type: "website" },
  twitter: { card: "summary", title: "Crop Image Online Free — Cut Image to Size", description: "Crop images to the exact size you need. Free online image cropper — no sign-up required." },
  alternates: { canonical: "https://freetools.lk/crop-image" },
};

export default function Page() {
  return <Client />;
}