"use client";

import React from "react";
import { motion } from "framer-motion";
import { Server, Database, Network, Cpu, ShieldCheck } from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";

const architectureModules = [
  {
    icon: Server,
    title: "Node Orchestrator",
    badge: "Control Plane",
    description:
      "Autonomous lifecycle manager capable of discovering local & remote nodes, monitoring GPU thermals/power, and handling low-overhead heartbeats.",
    features: ["Zero-Config Discovery", "Thermal & Power Balancing", "Tier 1-4 Profile Detection"],
    color: "#5e81ac",
  },
  {
    icon: Database,
    title: "Distributed Learning Engine",
    badge: "Core Logic",
    description:
      "Processes real-time experience streams (`learning_engine_experience.jsonl`), continuously tuning experience replay parameters across active workers.",
    features: ["JSONL Experience Ingestion", "Reinforcement Loss Tracking", "State Vector Synchronization"],
    color: "#81a1c1",
  },
  {
    icon: Network,
    title: "Resilient Mesh Network",
    badge: "Communication",
    description:
      "P2P networking layer with automatic route failovers, dynamic bandwidth negotiation, and low-latency payload serialization.",
    features: ["Self-Healing P2P Mesh", "Sub-10ms Packet Dispatch", "Automatic Node Rerouting"],
    color: "#8fbcbb",
  },
];

const hardwareTiers = [
  { name: "Tier 1", build: "RTX 3090 Build", spec: "24GB GDDR6X", color: "#a3be8c" },
  { name: "Tier 2", build: "RTX 4090 Build", spec: "24GB GDDR6X", color: "#ebcb8b" },
  { name: "Tier 3", build: "RTX 5090 Build", spec: "32GB GDDR7", color: "#d08770" },
  { name: "Tier 4", build: "Blackwell B200", spec: "192GB HBM3", color: "#bf616a" },
];

export const Architecture: React.FC = () => {
  return (
    <AnimatedSection id="architecture" className="py-24 border-t border-[#d8dee9]">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-4xl sm:text-5xl font-black text-[#2e3440] tracking-tight">
          Key Architecture & Compute Tiering
        </h2>
        <p className="mt-4 text-lg text-[#434c5e] leading-relaxed">
          Engineered for modularity, low-overhead inter-node sync, and hardware-aware profile scaling.
        </p>
      </div>

      {/* Architecture Modules Grid */}
      <div className="grid md:grid-cols-3 gap-8">
        {architectureModules.map((module, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ y: -6 }}
            viewport={{ once: false }}
            transition={{ duration: 0.5, delay: idx * 0.15 }}
            className="bg-[#d8dee9] border border-[#e5e9f0] rounded-2xl p-8 shadow-sm relative flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div
                  className="p-3.5 rounded-xl border bg-[#eceff4]"
                  style={{
                    borderColor: `${module.color}40`,
                    color: module.color,
                  }}
                >
                  <module.icon className="w-7 h-7" />
                </div>
                <span
                  className="text-xs font-mono font-bold px-3 py-1 rounded-full border bg-[#eceff4]"
                  style={{
                    borderColor: `${module.color}40`,
                    color: module.color,
                  }}
                >
                  {module.badge}
                </span>
              </div>

              <h3 className="text-2xl font-bold text-[#2e3440] mb-3">{module.title}</h3>
              <p className="text-sm text-[#3b4252] leading-relaxed mb-6">{module.description}</p>

              <div className="space-y-3 border-t border-[#e5e9f0] pt-5">
                {module.features.map((feat, fIdx) => (
                  <div key={fIdx} className="flex items-center space-x-2.5 text-xs font-semibold text-[#2e3440]">
                    <ShieldCheck className="w-4 h-4 text-[#5e81ac] shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Hardware Tier Profiles */}
      <div className="mt-16 bg-[#d8dee9] border border-[#e5e9f0] rounded-2xl p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold text-[#2e3440] flex items-center space-x-3">
              <Cpu className="w-6 h-6 text-[#5e81ac]" />
              <span>Hardware Tier Profiles</span>
            </h3>
            <p className="text-sm text-[#434c5e] mt-1">
              System profiles mapping telemetry metrics directly to GPU hardware configurations.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {hardwareTiers.map((tier, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.03 }}
              className="p-5 rounded-xl bg-[#eceff4] border border-[#e5e9f0] flex flex-col justify-between shadow-xs"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold text-[#2e3440]">{tier.name}</span>
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tier.color }}
                />
              </div>
              <p className="text-base font-bold text-[#2e3440]">{tier.build}</p>
              <p className="text-xs font-mono text-[#4c566a] mt-1">{tier.spec}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
};
