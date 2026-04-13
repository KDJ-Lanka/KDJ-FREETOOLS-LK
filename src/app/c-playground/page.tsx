import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "C/C++ Playground — Run C Code in Browser | FreeTools.lk",
  description:
    "Write and run C/C++ code directly in your browser — no installation, no sign-up. Perfect for learning C programming basics.",
};

export default function Page() {
  return <Client />;
}
