import type { Metadata } from "next";
import Client from "./Client";
export const metadata: Metadata = { title: "Sign PDF – FreeTools.lk", description: "Draw your signature and embed it anywhere on a PDF page." };
export default function Page() { return <Client />; }
