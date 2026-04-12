import type { Metadata } from "next";
import Client from "./Client";
export const metadata: Metadata = {
  title: "Passport Photo Maker Online Free — Make Passport Size Photo | FreeTools.lk",
  description: "Create passport-size photos instantly. Choose size standard and background color. No upload needed.",
  keywords: ["passport photo", "passport size photo", "id photo maker"],
};
export default function Page() { return <Client />; }
