import type { Metadata } from "next";
import Client from "./Client";
export const metadata: Metadata = { title: "PDF Redactor – FreeTools.lk", description: "Black out sensitive text and information permanently from PDFs." };
export default function Page() { return <Client />; }
