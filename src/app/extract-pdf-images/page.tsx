import type { Metadata } from "next";
import Client from "./Client";
export const metadata: Metadata = { title: "Extract PDF Images – FreeTools.lk", description: "Pull out all embedded images from a PDF as downloadable JPG files." };
export default function Page() { return <Client />; }
