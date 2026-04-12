import type { Metadata } from "next";
import Client from "./Client";
export const metadata: Metadata = { title: "PDF to Word – FreeTools.lk", description: "Convert PDF to editable Word (.docx) document in your browser." };
export default function Page() { return <Client />; }
