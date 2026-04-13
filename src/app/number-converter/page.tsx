import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Number System Converter — Binary Decimal Hex Octal | FreeTools.lk",
  description:
    "Convert numbers between Binary, Decimal, Octal, and Hexadecimal with full step-by-step working. Great for IT and CS students.",
};

export default function Page() {
  return <Client />;
}
