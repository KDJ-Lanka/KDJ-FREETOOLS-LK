import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Boomerang Video Online Free — Create Boomerang Effect | FreeTools.lk",
  description: "Create an Instagram-style boomerang video — forward then backward loop.",
  keywords: ["boomerang","boomerang video","video loop"],
};

export default function Page() { return <Client />; }
