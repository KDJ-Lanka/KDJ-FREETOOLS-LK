import type { Metadata } from "next";
import Client from "./Client";
export const metadata: Metadata = { title: "Word to PDF – FreeTools.lk", description: "Convert .docx Word documents to PDF — 100% in browser." };
export default function Page() { return <Client />; }
