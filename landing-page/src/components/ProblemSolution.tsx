"use client";

import React from "react";
import { motion } from "framer-motion";
import { Cpu, WifiOff, EyeOff, Zap, Shield, RefreshCw } from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";

const problemCards = [
  {
    icon: Cpu,
    number: "01",
    title: "Heterogeneous Resource Fragmentation",
    description:
      "Deploying AI workloads across mixed GPU architectures (such as RTX 3090, 4090, 5090, or Blackwell B200) leads to massive compute idle states and severe VRAM memory bottlenecks due to uncoordinated node allocation.",
    impact: "Causes up to 45% wasted GPU compute cycles during distributed training.",
  },
  {
    icon: WifiOff,
    number: "02",
    title: "Brittle Failovers Under Network Drops",
    description:
      "Traditional centralized cluster orchestrators stall or completely crash ongoing training pipelines when a single worker node encounters temporary packet loss, latency spikes, or sudden network disconnects.",
    impact: "Requires manual cluster restarts and causes loss of uncommitted model weights.",
  },
  {
    icon: EyeOff,
    number: "03",
    title: "Opaque Experience Replay & State Tracking",
    description:
      "Reinforcement learning and autonomous model synchronization lack real-time telemetry into experience buffers, making it nearly impossible to diagnose distributed divergence or trace node-level stalls.",
    impact: "Creates blind spots during multi-agent reinforcement learning runs.",
  },
];

const solutionCards = [
  {
    icon: Zap,
    number: "01",
    title: "Autonomous Tier-Aware Dispatcher",
    description:
      "Intelligently categorizes and assigns workloads across hardware profiles (Tiers 1 to 4) based on real-time VRAM telemetry, thermal headroom, and power consumption specs.",
    benefit: "Maximizes hardware utilization and eliminates compute idling.",
  },
  {
    icon: Shield,
    number: "02",
    title: "Self-Healing Resilient P2P Mesh",
    description:
      "Utilizes decentralized heartbeats and continuous failover rerouting so that worker nodes automatically resume state without interrupting active training runs during network drops.",
    benefit: "Ensures 99.9% pipeline continuity and zero data loss on node failure.",
  },
  {
    icon: RefreshCw,
    number: "03",
    title: "Real-Time Telemetry & Experience Synchronizer",
    description:
      "Streamlines experience replay buffers and state vectors directly from JSONL event streams with live dashboard visualization for instant diagnostic clarity.",
    benefit: "Provides full transparency into training throughput and loss convergence.",
  },
];

export const Problems: React.FC = () => {
  return (
    <AnimatedSection id="problems" className="py-24">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 w-full">
        <h2 className="text-4xl sm:text-5xl font-black text-[#2e3440] tracking-tight">
          The Core Problems We Face
        </h2>
        <p className="mt-4 text-lg text-[#434c5e] leading-relaxed">
          Modern AI clusters deployed on heterogeneous hardware suffer from critical fragmentation, single-point failures, and opaque state tracking.
        </p>
      </div>

      {/* Grid of Large High-Legibility Problem Cards */}
      <div className="grid md:grid-cols-3 gap-8 w-full">
        {problemCards.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ y: -6 }}
            viewport={{ once: false }}
            transition={{ duration: 0.5, delay: idx * 0.15 }}
            className="bg-[#d8dee9] border border-[#bf616a]/30 rounded-2xl p-8 shadow-sm relative flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="p-3.5 bg-[#bf616a]/15 text-[#bf616a] rounded-xl border border-[#bf616a]/25">
                  <item.icon className="w-7 h-7" />
                </div>
                <span className="text-2xl font-black font-mono text-[#bf616a]/60">
                  {item.number}
                </span>
              </div>

              <h3 className="text-2xl font-bold text-[#2e3440] leading-snug mb-4">
                {item.title}
              </h3>
              <p className="text-base text-[#3b4252] leading-relaxed mb-6">
                {item.description}
              </p>
            </div>

            <div className="pt-4 border-t border-[#e5e9f0] bg-[#e5e9f0]/60 -mx-8 -mb-8 p-6 rounded-b-2xl">
              <span className="text-xs font-bold text-[#bf616a] uppercase tracking-wider block mb-1">
                Impact on Cluster
              </span>
              <p className="text-xs font-medium text-[#2e3440]">{item.impact}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </AnimatedSection>
  );
};

export const Solutions: React.FC = () => {
  return (
    <AnimatedSection id="solutions" className="py-24 border-t border-[#d8dee9]">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 w-full">
        <h2 className="text-4xl sm:text-5xl font-black text-[#2e3440] tracking-tight">
          How ClustroConnect Solves It
        </h2>
        <p className="mt-4 text-lg text-[#434c5e] leading-relaxed">
          An autonomous, self-healing control loop designed to unify cluster nodes into a resilient, high-throughput compute mesh.
        </p>
      </div>

      {/* Grid of Large High-Legibility Solution Cards */}
      <div className="grid md:grid-cols-3 gap-8 w-full">
        {solutionCards.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ y: -6 }}
            viewport={{ once: false }}
            transition={{ duration: 0.5, delay: idx * 0.15 }}
            className="bg-[#d8dee9] border border-[#5e81ac]/30 rounded-2xl p-8 shadow-sm relative flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="p-3.5 bg-[#5e81ac]/15 text-[#5e81ac] rounded-xl border border-[#5e81ac]/25">
                  <item.icon className="w-7 h-7" />
                </div>
                <span className="text-2xl font-black font-mono text-[#5e81ac]/60">
                  {item.number}
                </span>
              </div>

              <h3 className="text-2xl font-bold text-[#2e3440] leading-snug mb-4">
                {item.title}
              </h3>
              <p className="text-base text-[#3b4252] leading-relaxed mb-6">
                {item.description}
              </p>
            </div>

            <div className="pt-4 border-t border-[#e5e9f0] bg-[#e5e9f0]/60 -mx-8 -mb-8 p-6 rounded-b-2xl">
              <span className="text-xs font-bold text-[#5e81ac] uppercase tracking-wider block mb-1">
                Measured Benefit
              </span>
              <p className="text-xs font-medium text-[#2e3440]">{item.benefit}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </AnimatedSection>
  );
};
