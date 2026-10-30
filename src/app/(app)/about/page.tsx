import type { Metadata } from "next";
import { AboutContent } from "@/components/about/about-content";

export const metadata: Metadata = {
  title: "Data and Methods",
  description:
    "Where Isobar's numbers come from, how alerts and forecast confidence are worked out, and what it can't tell you.",
};

export default function AboutPage() {
  return (
    <main
      id="main"
      className="mx-auto w-full max-w-(--page-max) flex-1 px-4 py-8 fit:pt-3 fit:pb-3"
    >
      <AboutContent />
    </main>
  );
}
