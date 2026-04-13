import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "SQL Playground — Practice SQL in Your Browser | FreeTools.lk",
  description:
    "Practice SQL with pre-loaded sample databases (Students, Store, Library) — write queries, see results instantly. Runs entirely in your browser.",
};

export default function Page() {
  return <Client />;
}
