import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Edit PDF Metadata Online Free — Title Author Keywords",
  description: "View and edit PDF title, author, subject and keywords. Free PDF metadata editor — no sign-up.",
  openGraph: { title: "Edit PDF Metadata Online Free — Title Author Keywords", description: "View and edit PDF title, author, subject and keywords. Free PDF metadata editor — no sign-up.", url: "https://freetools.lk/pdf-metadata", type: "website" },
  twitter: { card: "summary", title: "Edit PDF Metadata Online Free — Title Author Keywords", description: "View and edit PDF title, author, subject and keywords. Free PDF metadata editor — no sign-up." },
  alternates: { canonical: "https://freetools.lk/pdf-metadata" },
};

export default function Page() {
  return <Client />;
}