"use client";

import React from "react";
import { motion } from "framer-motion";
import { ExternalLink, Github, ShieldCheck, Zap } from "lucide-react";
import { ClusterSimulator } from "./ClusterSimulator";

interface Slide1HeroProps {
  onSimulationComplete?: () => void;
}

export const Slide1Hero: React.FC<Slide1HeroProps> = ({ onSimulationComplete }) => {
  return (
    <div className="w-full h-full flex flex-col justify-between p-10 sm:p-14 relative overflow-hidden bg-[#eceff4] text-[#2e3440]">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[45rem] h-[45rem] bg-[#81a1c1]/15 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Slide Header Tag */}
      <div className="flex items-center justify-between border-b border-[#d8dee9] pb-4">
        <div className="flex items-center space-x-4">
          <span className="px-4 py-1.5 bg-[#5e81ac] text-white text-sm font-mono font-bold rounded-xl uppercase tracking-wider shadow-xs">
            Slide 01 // System Overview
          </span>
          <span className="text-sm font-semibold text-[#4c566a] uppercase tracking-wider">
            Autonomous AI Cluster Control Loop
          </span>
        </div>
        <div className="flex items-center space-x-2 text-sm font-mono text-[#5e81ac] font-bold bg-[#e5e9f0] px-4 py-1.5 rounded-xl border border-[#d8dee9]">
          <Zap className="w-4 h-4 text-[#5e81ac]" />
          <span>Team UNLEFT</span>
        </div>
      </div>

      {/* Main Slide Content - Expanded 12-Column Full Width Grid */}
      <div className="my-auto grid grid-cols-12 gap-10 items-center w-full">
        {/* Left Column: Text & Hero CTAs (6 Columns) */}
        <div className="col-span-6 space-y-6 text-left pr-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center space-x-2.5 px-4 py-2 rounded-full bg-[#e5e9f0] border border-[#d8dee9] text-xs font-bold text-[#5e81ac] shadow-xs"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Self-Healing Heterogeneous Cluster Orchestrator</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-[#2e3440]"
          >
            <span className="bg-gradient-to-r from-[#5e81ac] via-[#81a1c1] to-[#88c0d0] bg-clip-text text-transparent">
              ClustroConnect
            </span>
            <br />
            Next-Gen Autonomous AI Infrastructure
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg lg:text-xl text-[#3b4252] leading-relaxed font-normal"
          >
            Unifying heterogeneous compute nodes, ML anomaly detection (Isolation Forest), dynamic workload orchestration, and sub-10ms P2P state synchronization into one self-healing control loop.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="pt-3 flex flex-wrap items-center gap-4"
          >
            <a
              href="/demo"
              className="px-6 py-3.5 rounded-xl font-bold text-sm bg-[#5e81ac] text-[#eceff4] hover:bg-[#81a1c1] transition-all shadow-md flex items-center space-x-2.5"
            >
              <span>Launch Live Dashboard</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 rounded-xl font-bold text-sm bg-[#e5e9f0] text-[#2e3440] hover:bg-[#d8dee9] border border-[#d8dee9] transition-all shadow-xs flex items-center space-x-2.5"
            >
              <Github className="w-4 h-4 text-[#2e3440]" />
              <span>Source Repository</span>
            </a>
          </motion.div>
        </div>

        {/* Right Column: Live Interactive Cluster Simulator (6 Columns) */}
        <div className="col-span-6 w-full">
          <ClusterSimulator onComplete={onSimulationComplete} />
        </div>
      </div>

      {/* Footer Specs Bar */}
      <div className="pt-4 border-t border-[#d8dee9] flex items-center justify-between text-xs text-[#4c566a] font-medium">
        <div className="flex items-center space-x-8">
          <span className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#a3be8c] animate-pulse" />
            <span className="font-semibold text-[#2e3440]">Zero-Config mDNS Node Discovery</span>
          </span>
          <span className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#5e81ac]" />
            <span className="font-semibold text-[#2e3440]">Isolation Forest Anomaly Isolation</span>
          </span>
          <span className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#88c0d0]" />
            <span className="font-semibold text-[#2e3440]">JSONL Experience Stream Sync</span>
          </span>
        </div>
        <span className="font-mono text-[#5e81ac] font-bold">Sub-10ms P2P Mesh Pipeline</span>
      </div>
    </div>
  );
};
