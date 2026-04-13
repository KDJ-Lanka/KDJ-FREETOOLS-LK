import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Hash Generator — MD5 SHA256 SHA512 Online | FreeTools.lk",
  description:
    "Generate MD5, SHA-1, SHA-224, SHA-256, SHA-384 and SHA-512 hashes from text or files — 100% private, runs in your browser.",
};

export default function Page() {
  return <Client />;
}
