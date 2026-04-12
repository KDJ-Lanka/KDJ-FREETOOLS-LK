import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Remove Silence from Audio Online Free | FreeTools.lk",
  description: "Automatically detect and remove silent gaps from audio files.",
  keywords: ["remove silence","silence remover","audio silence"],
};

export default function Page() { return <Client />; }
