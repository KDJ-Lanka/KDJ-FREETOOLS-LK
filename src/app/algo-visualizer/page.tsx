import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Algorithm Visualizer — Sorting Animations | FreeTools.lk",
  description:
    "Visualize Bubble Sort, Selection Sort, and Insertion Sort step-by-step. See comparisons, swaps, and sorted elements highlighted live.",
};

export default function Page() {
  return <Client />;
}
