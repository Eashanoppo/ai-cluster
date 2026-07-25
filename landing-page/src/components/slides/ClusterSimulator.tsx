"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Server, Activity, AlertTriangle, ShieldCheck, RefreshCw, Cpu } from "lucide-react";

interface NodeState {
  id: string;
  name: string;
  load: number;
  temp: number;
  vram: number;
  status: "optimal" | "warning" | "overload" | "rerouting" | "standby";
  activeTasks: number;
}

const initialNodes: NodeState[] = [
  { id: "node-1", name: "Cluster Node Alpha", load: 45, temp: 58, vram: 18.4, status: "optimal", activeTasks: 12 },
  { id: "node-2", name: "Cluster Node Beta", load: 82, temp: 74, vram: 22.8, status: "warning", activeTasks: 24 },
  { id: "node-3", name: "Cluster Node Gamma", load: 28, temp: 52, vram: 11.2, status: "optimal", activeTasks: 6 },
  { id: "node-4", name: "Cluster Node Delta", load: 60, temp: 64, vram: 19.5, status: "optimal", activeTasks: 16 },
];

interface ClusterSimulatorProps {
  onComplete?: () => void;
  stepDurationMs?: number; // duration of each simulation phase
}

export const ClusterSimulator: React.FC<ClusterSimulatorProps> = ({
  onComplete,
  stepDurationMs = 3800, // 3.8s per phase = ~15.2s for full cycle
}) => {
  const [nodes, setNodes] = useState<NodeState[]>(initialNodes);
  const [simPhase, setSimPhase] = useState<"normal" | "overload" | "rerouting" | "healed">("normal");
  const [logFeed, setLogFeed] = useState<string[]>([
    "SYS_INIT: P2P Cluster Mesh Established",
    "MONITOR: 4 Compute Nodes Online",
  ]);

  // Automated Cluster Scenario Sequence (Normal -> Overload -> Rerouting -> Healed -> Trigger Next Slide)
  useEffect(() => {
    const timer = setInterval(() => {
      setSimPhase((prev) => {
        if (prev === "normal") {
          // Phase 2: Overload
          setNodes((prevNodes) =>
            prevNodes.map((n) =>
              n.id === "node-2"
                ? { ...n, load: 98, temp: 88, status: "overload", activeTasks: 36 }
                : n
            )
          );
          setLogFeed((logs) => [
            "⚠️ ANOMALY: Node Beta VRAM Overload (98% load, 88°C)",
            "ML_ENGINE: Isolation Forest flagged thermal spike",
            ...logs.slice(0, 4),
          ]);
          return "overload";
        } else if (prev === "overload") {
          // Phase 3: Rerouting
          setNodes((prevNodes) =>
            prevNodes.map((n) => {
              if (n.id === "node-2") return { ...n, status: "rerouting", activeTasks: 12 };
              if (n.id === "node-3") return { ...n, load: 64, temp: 60, activeTasks: 18, status: "optimal" };
              if (n.id === "node-4") return { ...n, load: 74, temp: 68, activeTasks: 22, status: "optimal" };
              return n;
            })
          );
          setLogFeed((logs) => [
            "⚡ FAILOVER: Re-routing 24 task streams via P2P Mesh...",
            "CONTROL_PLANE: Workload dispatched to Gamma & Delta",
            ...logs.slice(0, 4),
          ]);
          return "rerouting";
        } else if (prev === "rerouting") {
          // Phase 4: Self-Healed
          setNodes((prevNodes) =>
            prevNodes.map((n) =>
              n.id === "node-2"
                ? { ...n, load: 40, temp: 56, vram: 14.2, status: "optimal", activeTasks: 10 }
                : n
            )
          );
          setLogFeed((logs) => [
            "✅ SELF-HEALED: Zero loss, 99.9% pipeline continuity",
            "STATUS: All 4 Nodes Operating At Optimal Headroom",
            ...logs.slice(0, 4),
          ]);
          return "healed";
        } else {
          // Phase 4 Complete: Trigger slide change callback if provided!
          if (onComplete) {
            onComplete();
          }
          // Reset to normal
          setNodes(initialNodes);
          setLogFeed((logs) => [
            "SYS_LOOP: Cluster Load Balance Cycle Reset",
            ...logs.slice(0, 4),
          ]);
          return "normal";
        }
      });
    }, stepDurationMs);

    return () => clearInterval(timer);
  }, [onComplete, stepDurationMs]);

  return (
    <div className="bg-[#d8dee9] border border-[#5e81ac]/30 rounded-2xl p-5 shadow-lg w-full flex flex-col justify-between space-y-4">
      {/* Simulation Header HUD */}
      <div className="flex items-center justify-between border-b border-[#e5e9f0] pb-3">
        <div className="flex items-center space-x-2.5">
          <span className="p-2 bg-[#5e81ac] text-white rounded-xl shadow-xs">
            <Server className="w-5 h-5" />
          </span>
          <div>
            <h4 className="text-sm font-bold text-[#2e3440] flex items-center gap-2">
              <span>Live Cluster Simulation Engine</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#5e81ac]/15 text-[#5e81ac] border border-[#5e81ac]/30 font-bold">
                AUTONOMOUS MESH
              </span>
            </h4>
            <p className="text-[11px] text-[#434c5e]">Real-time telemetry, anomaly isolation & failover rerouting</p>
          </div>
        </div>

        {/* Phase Indicator Badge */}
        <div className="flex items-center space-x-2">
          {simPhase === "normal" && (
            <span className="px-3 py-1 bg-[#a3be8c]/20 text-[#a3be8c] border border-[#a3be8c]/40 font-mono text-xs font-bold rounded-lg flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#a3be8c] animate-ping" />
              <span>Optimal State</span>
            </span>
          )}
          {simPhase === "overload" && (
            <span className="px-3 py-1 bg-[#bf616a]/20 text-[#bf616a] border border-[#bf616a]/40 font-mono text-xs font-bold rounded-lg flex items-center gap-1.5 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-[#bf616a]" />
              <span>Node Overload Anomaly</span>
            </span>
          )}
          {simPhase === "rerouting" && (
            <span className="px-3 py-1 bg-[#ebcb8b]/20 text-[#d08770] border border-[#ebcb8b]/40 font-mono text-xs font-bold rounded-lg flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-[#d08770] animate-spin" />
              <span>P2P Rerouting Active</span>
            </span>
          )}
          {simPhase === "healed" && (
            <span className="px-3 py-1 bg-[#8fbcbb]/20 text-[#5e81ac] border border-[#8fbcbb]/40 font-mono text-xs font-bold rounded-lg flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#5e81ac]" />
              <span>Self-Healed (99.9% Uptime)</span>
            </span>
          )}
        </div>
      </div>

      {/* 4 Cluster Nodes Live Status Grid */}
      <div className="grid grid-cols-2 gap-3.5">
        {nodes.map((node) => {
          const isOverloaded = node.status === "overload";
          const isRerouting = node.status === "rerouting";

          return (
            <motion.div
              key={node.id}
              layout
              className={`p-3.5 rounded-xl border transition-all duration-500 relative overflow-hidden ${
                isOverloaded
                  ? "bg-[#bf616a]/15 border-[#bf616a] ring-2 ring-[#bf616a]/30"
                  : isRerouting
                  ? "bg-[#ebcb8b]/15 border-[#d08770] ring-2 ring-[#d08770]/30"
                  : "bg-[#eceff4] border-[#e5e9f0]"
              }`}
            >
              {/* Node Top Row */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Cpu
                    className={`w-4 h-4 ${
                      isOverloaded ? "text-[#bf616a] animate-bounce" : "text-[#5e81ac]"
                    }`}
                  />
                  <span className="text-xs font-bold text-[#2e3440] font-mono">{node.name}</span>
                </div>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    isOverloaded
                      ? "bg-[#bf616a] text-white"
                      : isRerouting
                      ? "bg-[#d08770] text-white"
                      : "bg-[#e5e9f0] text-[#5e81ac]"
                  }`}
                >
                  {node.activeTasks} Tasks
                </span>
              </div>

              {/* Workload Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono font-bold text-[#4c566a]">
                  <span>Workload Utilization</span>
                  <span className={isOverloaded ? "text-[#bf616a] font-black" : "text-[#2e3440]"}>
                    {node.load}%
                  </span>
                </div>
                <div className="w-full h-2 bg-[#d8dee9] rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full transition-all duration-500 ${
                      isOverloaded
                        ? "bg-[#bf616a]"
                        : isRerouting
                        ? "bg-[#d08770]"
                        : node.load > 70
                        ? "bg-[#ebcb8b]"
                        : "bg-[#5e81ac]"
                    }`}
                    style={{ width: `${node.load}%` }}
                  />
                </div>
              </div>

              {/* Sub-Metrics */}
              <div className="mt-2 pt-2 border-t border-[#d8dee9]/60 flex justify-between text-[9px] font-mono text-[#4c566a]">
                <span>Temp: <strong className="text-[#2e3440]">{node.temp}°C</strong></span>
                <span>VRAM: <strong className="text-[#2e3440]">{node.vram} GB</strong></span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Terminal Output Log Stream */}
      <div className="bg-[#2e3440] text-[#eceff4] rounded-xl p-3 font-mono text-[10px] space-y-1 shadow-inner border border-[#4c566a]">
        <div className="flex items-center justify-between text-[#81a1c1] border-b border-[#4c566a] pb-1 mb-1 font-bold">
          <span className="flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-[#a3be8c]" />
            <span>Autonomous Telemetry Stream</span>
          </span>
          <span className="text-[9px] text-[#e5e9f0]/70">JSONL Real-Time Logger</span>
        </div>
        <AnimatePresence>
          {logFeed.map((log, i) => (
            <motion.div
              key={i + log}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className={`truncate ${
                log.includes("⚠️")
                  ? "text-[#bf616a] font-bold"
                  : log.includes("⚡")
                  ? "text-[#ebcb8b] font-bold"
                  : log.includes("✅")
                  ? "text-[#a3be8c] font-bold"
                  : "text-[#d8dee9]"
              }`}
            >
              {log}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
