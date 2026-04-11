import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Convert Video Online Free — MP4 WebM AVI MOV MKV",
  description: "Convert videos between MP4, WebM, AVI, MOV and MKV instantly. Free, no sign-up.",
  openGraph: { title: "Convert Video Online Free — MP4 WebM AVI MOV MKV", description: "Convert videos between MP4, WebM, AVI, MOV and MKV instantly. Free, no sign-up.", url: "https://freetools.lk/convert-video", type: "website" },
  twitter: { card: "summary", title: "Convert Video Online Free — MP4 WebM AVI MOV MKV", description: "Convert videos between MP4, WebM, AVI, MOV and MKV instantly. Free, no sign-up." },
  alternates: { canonical: "https://freetools.lk/convert-video" },
};

export default function Page() {
  return <Client />;
}