import React from "react";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Problems, Solutions } from "@/components/ProblemSolution";
import { Architecture } from "@/components/Architecture";
import { Benchmarks } from "@/components/Benchmarks";
import { EventTeam } from "@/components/EventTeam";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#eceff4] text-[#2e3440] bg-grid-pattern-light relative selection:bg-[#5e81ac] selection:text-white">
      {/* Navigation Bar */}
      <Navbar />

      {/* Main Showcase Page Sections */}
      <main className="space-y-12">
        <Hero />
        <Problems />
        <Solutions />
        <Architecture />
        <Benchmarks />
        <EventTeam />
      </main>

      {/* Footer */}
      <footer className="border-t border-[#d8dee9] bg-[#e5e9f0]/90 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-[#4c566a]">
          <div className="flex items-center space-x-3">
            <div className="relative w-6 h-6">
              <Image src="/logo.png" alt="Logo" fill className="object-contain" />
            </div>
            <span className="font-bold text-[#2e3440]">ClustroConnect</span>
            <span>— DIU National Hackathon Showcase</span>
          </div>

          <p>© 2026 Team UNLEFT. Built for Daffodil International University Hackathon.</p>
        </div>
      </footer>
    </div>
  );
}
