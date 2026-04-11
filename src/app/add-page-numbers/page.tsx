import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Add Page Numbers to PDF Online Free",
  description: "Stamp page numbers on every page of your PDF instantly. Free, no sign-up required.",
  openGraph: { title: "Add Page Numbers to PDF Online Free", description: "Stamp page numbers on every page of your PDF instantly. Free, no sign-up required.", url: "https://freetools.lk/add-page-numbers", type: "website" },
  twitter: { card: "summary", title: "Add Page Numbers to PDF Online Free", description: "Stamp page numbers on every page of your PDF instantly. Free, no sign-up required." },
  alternates: { canonical: "https://freetools.lk/add-page-numbers" },
};

export default function Page() {
  return <Client />;
}