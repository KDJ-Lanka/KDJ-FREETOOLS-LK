import type { Metadata } from "next";
import Client from "./Client";
export const metadata: Metadata = { title: "PDF to HTML – FreeTools.lk", description: "Convert PDF pages to clean HTML — open in any browser." };
export default function Page() { return <Client />; }
