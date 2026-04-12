import type { Metadata } from "next";
import Client from "./Client";
export const metadata: Metadata = {
  title: "AI Grammar Fixer Online Free — Fix Grammar and Spelling | FreeTools.lk",
  description: "Fix grammar, spelling and punctuation mistakes with AI. Paste your text and get instant corrections. Runs in your browser.",
  keywords: ["grammar fixer", "grammar checker", "spell check", "AI grammar corrector"],
};
export default function Page() { return <Client />; }
