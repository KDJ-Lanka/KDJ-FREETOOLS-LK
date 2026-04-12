import type { Metadata } from "next";
import Client from "./Client";
export const metadata: Metadata = {
  title: "PDF Password Remover — Remove PDF Password Online Free | FreeTools.lk",
  description: "Remove password protection from PDF files. 100% private — runs entirely in your browser, no uploads.",
};
export default function Page() { return <Client />; }
