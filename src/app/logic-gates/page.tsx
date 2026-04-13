import type { Metadata } from "next";
import Client from "./Client";

export const metadata: Metadata = {
  title: "Logic Gate Simulator — AND OR NOT NAND NOR XOR | FreeTools.lk",
  description:
    "Interactive logic gate simulator with truth tables. Toggle inputs and see outputs instantly for AND, OR, NOT, NAND, NOR, XOR, XNOR gates.",
};

export default function Page() {
  return <Client />;
}
