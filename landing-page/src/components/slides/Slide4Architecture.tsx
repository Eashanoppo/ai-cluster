"use client";

import React from "react";
import { motion } from "framer-motion";
import { Server, Database, Network, ShieldCheck, Layers, Cpu, Radio, GitBranch } from "lucide-react";

const architectureModules = [
  {
    icon: Server,
    title: "Node Orchestrator",
    badge: "Control Plane",
    description:
      "Autonomous daemon managing local & remote node discovery (mDNS/Zeroconf), thermal headroom, power telemetry, and high-frequency heartbeats.",
    features: ["mDNS Zero-Config Discovery", "Thermal Headroom Balancing", "Dynamic Workload Profiling", "Low-Overhead Heartbeats"],
    color: "#5e81ac",
  },
  {
    icon: Database,
    title: "Distributed Learning Engine",
    badge: "Core ML Logic",
    description:
      "Ingests JSONL experience streams (`learning_engine_experience.jsonl`), dynamically adjusting experience replay parameters across active workers.",
    features: ["JSONL Experience Ingestion", "RL Loss Curve Tracking", "State Vector Synchronization", "Isolation Forest ML Anomaly"],
    color: "#81a1c1",
  },
  {
    icon: Network,
    title: "Resilient P2P Mesh Network",
    badge: "Communication",
    description:
      "Decentralized mesh with automated packet rerouting, sub-10ms gRPC stream dispatch, and dynamic inter-node bandwidth negotiation.",
    features: ["Self-Healing P2P Topology", "Sub-10ms Packet Dispatch", "Zero-Downtime Failover", "Direct Memory Access (DMA)"],
    color: "#8fbcbb",
  },
];

export const Slide4Architecture: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col justify-between p-10 sm:p-14 relative overflow-hidden bg-[#eceff4] text-[#2e3440]">
      {/* Slide Header */}
      <div className="flex items-center justify-between border-b border-[#d8dee9] pb-4">
        <div className="flex items-center space-x-4">
          <span className="px-4 py-1.5 bg-[#5e81ac] text-white text-sm font-mono font-bold rounded-xl uppercase tracking-wider shadow-xs">
            Slide 04 // Topology Blueprint
          </span>
          <span className="text-sm font-semibold text-[#4c566a] uppercase tracking-wider">
            Decoupled Microservice Subsystem Architecture
          </span>
        </div>
        <div className="flex items-center space-x-2 text-sm font-mono text-[#5e81ac] font-bold bg-[#e5e9f0] px-4 py-1.5 rounded-xl border border-[#d8dee9]">
          <Layers className="w-4 h-4 text-[#5e81ac]" />
          <span>Microservices Topology</span>
        </div>
      </div>

      {/* Header Title */}
      <div className="text-center my-3">
        <h2 className="text-4xl lg:text-5xl font-black text-[#2e3440] tracking-tight">
          Key Compute Modules & Decoupled Architecture
        </h2>
        <p className="text-base lg:text-lg text-[#434c5e] mt-2 max-w-4xl mx-auto">
          Engineered for low-overhead inter-node IPC, zero-config peer discovery, and asynchronous checkpoint streaming.
        </p>
      </div>

      {/* 3 Architecture Modules Grid - Expanded Full Width */}
      <div className="grid grid-cols-3 gap-8 my-auto w-full">
        {architectureModules.map((module, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.12 }}
            className="bg-[#d8dee9] border border-[#e5e9f0] rounded-2xl p-7 shadow-sm flex flex-col justify-between h-full relative"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div
                  className="p-3 rounded-xl border bg-[#eceff4] shadow-xs"
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

              <h3 className="text-xl lg:text-2xl font-bold text-[#2e3440] mb-3">{module.title}</h3>
              <p className="text-sm lg:text-base text-[#3b4252] leading-relaxed mb-6">{module.description}</p>
            </div>

            <div className="space-y-2.5 border-t border-[#e5e9f0] pt-4">
              {module.features.map((feat, fIdx) => (
                <div key={fIdx} className="flex items-center space-x-2.5 text-xs lg:text-sm font-semibold text-[#2e3440]">
                  <ShieldCheck className="w-4 h-4 text-[#5e81ac] shrink-0" />
                  <span className="truncate">{feat}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Animated Flow Topology Diagram Banner */}
      <div className="bg-[#e5e9f0] border border-[#d8dee9] rounded-xl p-4 flex items-center justify-between font-mono text-xs shadow-xs">
        <div className="flex items-center space-x-2.5 text-[#5e81ac]">
          <Cpu className="w-5 h-5" />
          <span className="font-bold">Heterogeneous Compute Node</span>
        </div>
        <GitBranch className="w-4 h-4 text-[#4c566a]" />
        <div className="flex items-center space-x-2.5 text-[#81a1c1]">
          <Radio className="w-5 h-5 animate-pulse text-[#5e81ac]" />
          <span className="font-bold">Sub-10ms P2P IPC Buffer</span>
        </div>
        <GitBranch className="w-4 h-4 text-[#4c566a]" />
        <div className="flex items-center space-x-2.5 text-[#8fbcbb]">
          <Database className="w-5 h-5 text-[#8fbcbb]" />
          <span className="font-bold">JSONL Telemetry Stream</span>
        </div>
      </div>
    </div>
  );
};
