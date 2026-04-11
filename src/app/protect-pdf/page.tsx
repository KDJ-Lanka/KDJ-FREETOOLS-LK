import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Protect PDF Online Free — Password Protect PDF",
  description: "Lock your PDF with a password to keep it private. Free PDF encryption tool — no sign-up.",
  openGraph: { title: "Protect PDF Online Free — Password Protect PDF", description: "Lock your PDF with a password to keep it private. Free PDF encryption tool — no sign-up.", url: "https://freetools.lk/protect-pdf", type: "website" },
  twitter: { card: "summary", title: "Protect PDF Online Free — Password Protect PDF", description: "Lock your PDF with a password to keep it private. Free PDF encryption tool — no sign-up." },
  alternates: { canonical: "https://freetools.lk/protect-pdf" },
};

export default function Page() {
  return <Client />;
}