import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Convert Image Online Free — JPG PNG WebP BMP GIF",
  description: "Convert images between JPG, PNG, WebP, BMP and GIF instantly. Free, no sign-up.",
  openGraph: { title: "Convert Image Online Free — JPG PNG WebP BMP GIF", description: "Convert images between JPG, PNG, WebP, BMP and GIF instantly. Free, no sign-up.", url: "https://freetools.lk/convert-image", type: "website" },
  twitter: { card: "summary", title: "Convert Image Online Free — JPG PNG WebP BMP GIF", description: "Convert images between JPG, PNG, WebP, BMP and GIF instantly. Free, no sign-up." },
  alternates: { canonical: "https://freetools.lk/convert-image" },
};

export default function Page() {
  return <Client />;
}