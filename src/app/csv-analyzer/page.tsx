import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "CSV Analyzer — Analyze CSV Files with Python | FreeTools.lk",
  description:
    "Upload a CSV file and get instant statistics, column types, missing values and row preview — all processed locally in your browser.",
};

export default function Page() {
  return <Client />;
}
