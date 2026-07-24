"use client";

import React from "react";
import { motion } from "framer-motion";
import { ExternalLink, Layers, Github } from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";

export const Hero: React.FC = () => {
  return (
    <AnimatedSection id="hero" className="text-center relative pt-20 sm:pt-28 pb-32 min-h-[calc(100vh-5rem)] justify-center">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[34rem] h-[34rem] bg-[#81a1c1]/20 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Main Tagline */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[#2e3440] max-w-5xl mx-auto leading-[1.15]"
      >
        Elevating Distributed AI Execution:{" "}
        <span className="bg-gradient-to-r from-[#5e81ac] via-[#81a1c1] to-[#88c0d0] bg-clip-text text-transparent">
          Next-Gen Autonomous Infrastructure
        </span>{" "}
        for Mission-Critical Workloads
      </motion.h1>

      {/* Subtext for emphasis */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="mt-8 text-xl sm:text-2xl text-[#3b4252] max-w-3xl mx-auto leading-relaxed font-normal"
      >
        Unifying heterogeneous compute nodes, intelligent fault recovery, and real-time execution optimization into one seamless AI cluster experience.
      </motion.p>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.5 }}
        className="mt-12 flex flex-wrap justify-center gap-5"
      >
        <motion.a
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.98 }}
          href="/demo"
          className="px-7 py-4 rounded-xl font-bold text-base bg-[#5e81ac] text-[#eceff4] hover:bg-[#81a1c1] transition-all shadow-lg flex items-center space-x-3"
        >
          <span>Launch Main Product Demo</span>
          <ExternalLink className="w-4 h-4" />
        </motion.a>

        <motion.a
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.98 }}
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="px-7 py-4 rounded-xl font-bold text-base bg-[#e5e9f0] text-[#2e3440] hover:bg-[#d8dee9] border border-[#d8dee9] transition-all shadow-sm flex items-center space-x-3"
        >
          <Github className="w-5 h-5 text-[#2e3440]" />
          <span>GitHub Repository</span>
        </motion.a>

        <motion.a
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.98 }}
          href="#architecture"
          className="px-7 py-4 rounded-xl font-bold text-base bg-[#e5e9f0] text-[#3b4252] hover:bg-[#d8dee9] border border-[#d8dee9] transition-all shadow-sm flex items-center space-x-3"
        >
          <Layers className="w-5 h-5 text-[#5e81ac]" />
          <span>Explore Architecture</span>
        </motion.a>
      </motion.div>
    </AnimatedSection>
  );
};
