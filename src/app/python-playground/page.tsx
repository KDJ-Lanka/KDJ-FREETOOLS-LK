import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Python Playground — Run Python in Browser | FreeTools.lk",
  description:
    "Execute Python code right in your browser with Pyodide WASM. No install, no server — completely private.",
};

export default function Page() {
  return <Client />;
}
