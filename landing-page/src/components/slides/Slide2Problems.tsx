"use client";

import React from "react";
import { motion } from "framer-motion";
import { Cpu, WifiOff, EyeOff, AlertTriangle, XCircle, Activity } from "lucide-react";

const problemCards = [
  {
    icon: Cpu,
    number: "01",
    title: "Heterogeneous Compute & Memory Fragmentation",
    description:
      "Deploying distributed AI workloads across mixed GPU/compute node architectures leads to severe Ring-AllReduce gradient synchronization barriers, uncoordinated VRAM memory allocation, and up to 45% idle compute states during training.",
    impact: "Causes severe compute cycle waste & memory fragmentation barriers.",
    techCode: "ERR_VRAM_FRAGMENTATION_IDLE",
    bgAccent: "from-[#bf616a]/10 to-transparent",
  },
  {
    icon: WifiOff,
    number: "02",
    title: "Brittle Master Failovers Under Network Drops",
    description:
      "Centralized cluster orchestrators experience immediate pipeline crashes when a single worker node encounters temporary TCP packet loss, latency spikes, or sudden network disconnects during active gradient steps.",
    impact: "Triggers total cluster pipeline aborts & uncommitted model weight loss.",
    techCode: "ERR_COORDINATOR_TIMEOUT_FAIL",
    bgAccent: "from-[#d08770]/10 to-transparent",
  },
  {
    icon: EyeOff,
    number: "03",
    title: "Opaque Experience Replay & State Telemetry",
    description:
      "Multi-agent reinforcement learning and distributed models lack real-time introspection into experience replay buffers (`.jsonl` streams), concealing worker node divergence and memory leak stalls.",
    impact: "Creates diagnostic blind spots during multi-agent model synchronization.",
    techCode: "ERR_REPLAY_VECTOR_DIVERGENCE",
    bgAccent: "from-[#ebcb8b]/10 to-transparent",
  },
];

export const Slide2Problems: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col justify-between p-10 sm:p-14 relative overflow-hidden bg-[#eceff4] text-[#2e3440]">
      {/* Slide Header */}
      <div className="flex items-center justify-between border-b border-[#d8dee9] pb-4">
        <div className="flex items-center space-x-4">
          <span className="px-4 py-1.5 bg-[#bf616a] text-white text-sm font-mono font-bold rounded-xl uppercase tracking-wider shadow-xs">
            Slide 02 // Infrastructure Bottlenecks
          </span>
          <span className="text-sm font-semibold text-[#4c566a] uppercase tracking-wider">
            Distributed System Vulnerabilities
          </span>
        </div>
        <div className="flex items-center space-x-2 text-sm font-mono text-[#bf616a] font-bold bg-[#e5e9f0] px-4 py-1.5 rounded-xl border border-[#d8dee9]">
          <AlertTriangle className="w-4 h-4 text-[#bf616a]" />
          <span>Failure Vectors</span>
        </div>
      </div>

      {/* Header Title */}
      <div className="text-center my-4">
        <h2 className="text-4xl lg:text-5xl font-black text-[#2e3440] tracking-tight">
          Critical Cluster Infrastructure Vulnerabilities
        </h2>
        <p className="text-base lg:text-lg text-[#434c5e] mt-2 max-w-4xl mx-auto">
          Conventional cluster management engines stall when scaling across uncoordinated heterogeneous compute nodes and unstable network topologies.
        </p>
      </div>

      {/* 3-Column Problem Cards Grid - Expanded Full Width */}
      <div className="grid grid-cols-3 gap-8 my-auto w-full">
        {problemCards.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.12 }}
            className={`bg-[#d8dee9] border border-[#bf616a]/30 rounded-2xl p-7 shadow-sm flex flex-col justify-between h-full relative overflow-hidden bg-gradient-to-b ${item.bgAccent}`}
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="p-3 bg-[#bf616a]/15 text-[#bf616a] rounded-xl border border-[#bf616a]/25 shadow-xs">
                  <item.icon className="w-7 h-7" />
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-md bg-[#bf616a]/10 text-[#bf616a] border border-[#bf616a]/25">
                  {item.techCode}
                </span>
              </div>

              <h3 className="text-xl lg:text-2xl font-bold text-[#2e3440] leading-snug mb-3">
                {item.title}
              </h3>
              <p className="text-sm lg:text-base text-[#3b4252] leading-relaxed mb-6">
                {item.description}
              </p>
            </div>

            <div className="pt-4 border-t border-[#e5e9f0] bg-[#e5e9f0]/80 -mx-7 -mb-7 p-6 rounded-b-2xl">
              <div className="flex items-center space-x-2 mb-1">
                <XCircle className="w-4 h-4 text-[#bf616a]" />
                <span className="text-xs font-bold text-[#bf616a] uppercase tracking-wider">
                  Cluster Consequence
                </span>
              </div>
              <p className="text-sm font-semibold text-[#2e3440] leading-snug">{item.impact}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Technical Footer */}
      <div className="pt-4 border-t border-[#d8dee9] flex items-center justify-between text-sm text-[#4c566a] font-medium">
        <span>Heterogeneous Worker Hardware & Synchronous Barrier Stalls</span>
        <span className="font-mono text-[#bf616a] font-bold">Measured Waste: ~45% VRAM Bandwidth / Cycle Loss</span>
      </div>
    </div>
  );
};
