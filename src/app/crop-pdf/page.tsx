import type { Metadata } from "next";
import Client from "./Client";
export const metadata: Metadata = { title: "Crop PDF Pages – FreeTools.lk", description: "Trim margins and crop pages to a custom size." };
export default function Page() { return <Client />; }
