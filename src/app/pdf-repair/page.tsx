import type { Metadata } from "next";
import Client from "./Client";
export const metadata: Metadata = { title: "PDF Repair – FreeTools.lk", description: "Attempt to fix and recover corrupted or damaged PDF files." };
export default function Page() { return <Client />; }
