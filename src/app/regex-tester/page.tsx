import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Python Regex Tester — Live Regex with Highlighting | FreeTools.lk",
  description:
    "Test Python regular expressions with live match highlighting, group details, and flag support — runs entirely in your browser.",
};

export default function Page() {
  return <Client />;
}
