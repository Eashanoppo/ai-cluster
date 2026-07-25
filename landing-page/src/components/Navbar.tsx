"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ExternalLink, Github } from "lucide-react";

export const Navbar: React.FC = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 backdrop-blur-md bg-[#eceff4]/90 border-b border-[#d8dee9] shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-3">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-[#e5e9f0] p-1 border border-[#d8dee9]">
            <Image
              src="/logo.png"
              alt="ClustroConnect Logo"
              fill
              className="object-contain p-0.5"
              priority
            />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-[#2e3440]">
              Clustro<span className="text-[#5e81ac]">Connect</span>
            </span>
            <span className="block text-[10px] uppercase tracking-widest text-[#5e81ac] font-mono font-semibold">
              Autonomous AI Cluster
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8 text-base font-semibold text-[#2e3440]">
          <a
            href="#problems"
            className="hover:text-[#5e81ac] transition-colors duration-200"
          >
            Problems
          </a>
          <a
            href="#solutions"
            className="hover:text-[#5e81ac] transition-colors duration-200"
          >
            Our Solutions
          </a>
          <a
            href="#architecture"
            className="hover:text-[#5e81ac] transition-colors duration-200"
          >
            Architecture
          </a>
          <a
            href="#benchmarks"
            className="hover:text-[#5e81ac] transition-colors duration-200"
          >
            Benchmarks
          </a>
          <a
            href="#team"
            className="hover:text-[#5e81ac] transition-colors duration-200"
          >
            Team & Event
          </a>
        </nav>

        {/* Action Button: Direct to Main Product/Demo */}
        <div className="flex items-center space-x-3">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl bg-[#e5e9f0] hover:bg-[#d8dee9] border border-[#d8dee9] text-[#2e3440] transition-all"
            title="GitHub Repository"
          >
            <Github className="w-4 h-4 text-[#2e3440]" />
          </a>

          <a
            href="/demo"
            className="px-5 py-2.5 text-xs font-bold text-[#eceff4] bg-[#5e81ac] hover:bg-[#81a1c1] rounded-xl transition-all duration-200 shadow-md inline-flex items-center space-x-2"
          >
            <span>Launch Main Product</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </motion.header>
  );
};
