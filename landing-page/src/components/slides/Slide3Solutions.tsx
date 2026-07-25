"use client";

import React from "react";
import { motion } from "framer-motion";
import { Zap, Shield, RefreshCw, CheckCircle2, ArrowRight, Activity, Cpu } from "lucide-react";

const solutionCards = [
  {
    icon: Zap,
    number: "01",
    title: "Autonomous Hardware-Aware Dispatcher",
    description:
      "Dynamically assigns tensor operations across heterogeneous compute nodes based on real-time VRAM telemetry, thermal headroom, and FLOPS utilization using GBDT workload classification algorithms.",
    benefit: "Eliminates compute idling & balances thermal headroom dynamically.",
    techCode: "CONTROL_LOOP_DISPATCHER",
    bgAccent: "from-[#5e81ac]/10 to-transparent",
  },
  {
    icon: Shield,
    number: "02",
    title: "Self-Healing P2P Resilient Mesh",
    description:
      "Employs decentralized P2P heartbeats and dynamic route failovers so worker nodes instantly resume execution state without halting active training runs upon transient TCP packet drops.",
    benefit: "Ensures 99.9% pipeline continuity & zero checkpoint loss on failure.",
    techCode: "P2P_MESH_FAILOVER_HEAL",
    bgAccent: "from-[#8fbcbb]/10 to-transparent",
  },
  {
    icon: RefreshCw,
    number: "03",
    title: "Real-Time Telemetry & Experience Sync",
    description:
      "Ingests structured JSONL event streams (`learning_engine_experience.jsonl`) with sub-10ms latency, offering complete introspection into model loss convergence and experience buffers.",
    benefit: "Provides visual diagnostic clarity & zero-divergence RL training.",
    techCode: "JSONL_STREAM_SYNCHRONIZER",
    bgAccent: "from-[#a3be8c]/10 to-transparent",
  },
];

export const Slide3Solutions: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col justify-between p-10 sm:p-14 relative overflow-hidden bg-[#eceff4] text-[#2e3440]">
      {/* Slide Header */}
      <div className="flex items-center justify-between border-b border-[#d8dee9] pb-4">
        <div className="flex items-center space-x-4">
          <span className="px-4 py-1.5 bg-[#5e81ac] text-white text-sm font-mono font-bold rounded-xl uppercase tracking-wider shadow-xs">
            Slide 03 // Autonomous Solutions
          </span>
          <span className="text-sm font-semibold text-[#4c566a] uppercase tracking-wider">
            ClustroConnect Closed-Loop Control System
          </span>
        </div>
        <div className="flex items-center space-x-2 text-sm font-mono text-[#5e81ac] font-bold bg-[#e5e9f0] px-4 py-1.5 rounded-xl border border-[#d8dee9]">
          <CheckCircle2 className="w-4 h-4 text-[#5e81ac]" />
          <span>Proven Innovations</span>
        </div>
      </div>

      {/* Header Title */}
      <div className="text-center my-4">
        <h2 className="text-4xl lg:text-5xl font-black text-[#2e3440] tracking-tight">
          How ClustroConnect Resolves Infrastructure Failure Modes
        </h2>
        <p className="text-base lg:text-lg text-[#434c5e] mt-2 max-w-4xl mx-auto">
          Unifying zero-config discovery, anomaly detection, and state synchronization into an autonomous, closed-loop orchestrator.
        </p>
      </div>

      {/* 3-Column Solution Cards Grid - Expanded Full Width */}
      <div className="grid grid-cols-3 gap-8 my-auto w-full">
        {solutionCards.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.12 }}
            className={`bg-[#d8dee9] border border-[#5e81ac]/30 rounded-2xl p-7 shadow-sm flex flex-col justify-between h-full relative overflow-hidden bg-gradient-to-b ${item.bgAccent}`}
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="p-3 bg-[#5e81ac]/15 text-[#5e81ac] rounded-xl border border-[#5e81ac]/25 shadow-xs">
                  <item.icon className="w-7 h-7" />
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-md bg-[#5e81ac]/10 text-[#5e81ac] border border-[#5e81ac]/25">
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
                <ArrowRight className="w-4 h-4 text-[#5e81ac]" />
                <span className="text-xs font-bold text-[#5e81ac] uppercase tracking-wider">
                  Verified Outcome
                </span>
              </div>
              <p className="text-sm font-semibold text-[#2e3440] leading-snug">{item.benefit}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Technical Control Loop Flow Footer */}
      <div className="pt-4 border-t border-[#d8dee9] flex items-center justify-between text-sm text-[#4c566a] font-medium">
        <div className="flex items-center space-x-6 font-mono text-xs">
          <span className="text-[#5e81ac] font-bold">1. Telemetry Poll</span>
          <span>→</span>
          <span className="text-[#88c0d0] font-bold">2. ML Anomaly Check</span>
          <span>→</span>
          <span className="text-[#8fbcbb] font-bold">3. P2P Reroute</span>
          <span>→</span>
          <span className="text-[#a3be8c] font-bold">4. State Replay</span>
        </div>
        <span className="font-mono text-[#5e81ac] font-bold">Continuous Closed Loop Execution</span>
      </div>
    </div>
  );
};
