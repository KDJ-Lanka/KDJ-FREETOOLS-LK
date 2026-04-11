import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Unlock PDF Online Free — Remove PDF Password",
  description: "Remove the password from a PDF you own instantly. Free PDF unlocker — no sign-up, 100% private.",
  openGraph: { title: "Unlock PDF Online Free — Remove PDF Password", description: "Remove the password from a PDF you own instantly. Free PDF unlocker — no sign-up, 100% private.", url: "https://freetools.lk/unlock-pdf", type: "website" },
  twitter: { card: "summary", title: "Unlock PDF Online Free — Remove PDF Password", description: "Remove the password from a PDF you own instantly. Free PDF unlocker — no sign-up, 100% private." },
  alternates: { canonical: "https://freetools.lk/unlock-pdf" },
};

export default function Page() {
  return <Client />;
}