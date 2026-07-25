import React from "react";
import { SlideDeck } from "@/components/slides/SlideDeck";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ClustroConnect - Presentation Slides",
  description: "ClustroConnect autonomous AI cluster management presentation deck.",
};

export default function SlidesPage() {
  return (
    <main className="min-h-screen bg-[#eceff4] text-[#2e3440] selection:bg-[#5e81ac] selection:text-white font-sans">
      <SlideDeck />
    </main>
  );
}
