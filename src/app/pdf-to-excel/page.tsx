import type { Metadata } from "next";
import Client from "./Client";
export const metadata: Metadata = { title: "PDF to Excel – FreeTools.lk", description: "Extract tables and text from PDF into an Excel spreadsheet." };
export default function Page() { return <Client />; }
