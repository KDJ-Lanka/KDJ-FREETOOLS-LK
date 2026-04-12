import type { Metadata } from "next";
import Client from "./Client";
export const metadata: Metadata = { title: "Flatten PDF – FreeTools.lk", description: "Flatten form fields and annotations into the page permanently." };
export default function Page() { return <Client />; }
