import type { Metadata } from "next";
import { MyLooks } from "./MyLooks";

export const metadata: Metadata = { title: "Meine Looks", robots: { index: false } };

export default function MyLooksPage() {
  return <MyLooks />;
}
