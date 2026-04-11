import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "PDF Grayscale Online Free — Convert PDF to Black and White",
  description: "Convert a color PDF to black and white (grayscale) in seconds. Free, private, no sign-up.",
  openGraph: { title: "PDF Grayscale Online Free — Convert PDF to Black and White", description: "Convert a color PDF to black and white (grayscale) in seconds. Free, private, no sign-up.", url: "https://freetools.lk/pdf-grayscale", type: "website" },
  twitter: { card: "summary", title: "PDF Grayscale Online Free — Convert PDF to Black and White", description: "Convert a color PDF to black and white (grayscale) in seconds. Free, private, no sign-up." },
  alternates: { canonical: "https://freetools.lk/pdf-grayscale" },
};

export default function Page() {
  return <Client />;
}