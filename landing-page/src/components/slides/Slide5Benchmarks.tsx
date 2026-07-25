"use client";

import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Activity, Gauge, TrendingDown, Layers, Zap, Server, ShieldCheck } from "lucide-react";

const benchmarkData = [
  { step: 100, throughput: 420, latency: 18.5, loss: 2.85, efficiency: 74 },
  { step: 200, throughput: 650, latency: 15.2, loss: 2.10, efficiency: 81 },
  { step: 300, throughput: 890, latency: 12.8, loss: 1.62, efficiency: 88 },
  { step: 400, throughput: 1120, latency: 10.4, loss: 1.15, efficiency: 93 },
  { step: 500, throughput: 1380, latency: 8.9, loss: 0.78, efficiency: 96 },
  { step: 600, throughput: 1540, latency: 7.6, loss: 0.45, efficiency: 98.4 },
];

export const Slide5Benchmarks: React.FC = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="w-full h-full flex flex-col justify-between p-10 sm:p-14 relative overflow-hidden bg-[#eceff4] text-[#2e3440]">
      {/* Slide Header */}
      <div className="flex items-center justify-between border-b border-[#d8dee9] pb-4">
        <div className="flex items-center space-x-4">
          <span className="px-4 py-1.5 bg-[#5e81ac] text-white text-sm font-mono font-bold rounded-xl uppercase tracking-wider shadow-xs">
            Slide 05 // Empirical Telemetry
          </span>
          <span className="text-sm font-semibold text-[#4c566a] uppercase tracking-wider">
            System Performance & Empirical Validation
          </span>
        </div>
        <div className="flex items-center space-x-2 text-sm font-mono text-[#5e81ac] font-bold bg-[#e5e9f0] px-4 py-1.5 rounded-xl border border-[#d8dee9]">
          <Zap className="w-4 h-4 text-[#5e81ac]" />
          <span>Real-Time Benchmarks</span>
        </div>
      </div>

      {/* Top Telemetry Metric Stat Cards - Full Width */}
      <div className="grid grid-cols-4 gap-6 my-3">
        <div className="bg-[#d8dee9] border border-[#e5e9f0] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center space-x-2 text-[#5e81ac] mb-2">
            <Zap className="w-5 h-5" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Peak Throughput</span>
          </div>
          <p className="text-3xl font-black text-[#2e3440]">1,540 <span className="text-xs font-normal text-[#4c566a]">samples/s</span></p>
        </div>

        <div className="bg-[#d8dee9] border border-[#e5e9f0] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center space-x-2 text-[#8fbcbb] mb-2">
            <Gauge className="w-5 h-5" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider">P2P RPC Latency</span>
          </div>
          <p className="text-3xl font-black text-[#2e3440]">7.6 <span className="text-xs font-normal text-[#4c566a]">ms</span></p>
        </div>

        <div className="bg-[#d8dee9] border border-[#e5e9f0] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center space-x-2 text-[#87a070] mb-2">
            <TrendingDown className="w-5 h-5" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Final Model Loss</span>
          </div>
          <p className="text-3xl font-black text-[#2e3440]">0.45 <span className="text-xs font-bold text-[#87a070]">(-84.2%)</span></p>
        </div>

        <div className="bg-[#d8dee9] border border-[#e5e9f0] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center space-x-2 text-[#d08770] mb-2">
            <Layers className="w-5 h-5" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Mesh Efficiency</span>
          </div>
          <p className="text-3xl font-black text-[#2e3440]">98.4%</p>
        </div>
      </div>

      {/* Main Content Area: Charts + Technical Breakdown Grid */}
      <div className="grid grid-cols-12 gap-6 my-auto w-full">
        {/* Left Column: Recharts Graphs (8 Columns) */}
        <div className="col-span-8 grid grid-cols-2 gap-6">
          {/* Throughput Chart */}
          <div className="bg-[#d8dee9] border border-[#e5e9f0] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#2e3440] flex items-center space-x-2">
                <Activity className="w-4 h-4 text-[#5e81ac]" />
                <span>Throughput Acceleration</span>
              </h3>
              <span className="text-[10px] font-mono text-[#5e81ac] bg-[#eceff4] px-2.5 py-1 rounded-md border border-[#e5e9f0] font-bold">
                Samples / Sec
              </span>
            </div>

            <div className="h-44 w-full">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={benchmarkData}>
                    <defs>
                      <linearGradient id="throughputGradSlideEnriched2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5e81ac" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#5e81ac" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e9f0" opacity={0.9} />
                    <XAxis dataKey="step" stroke="#2e3440" fontSize={11} fontWeight={600} />
                    <YAxis stroke="#2e3440" fontSize={11} fontWeight={600} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#eceff4", borderColor: "#d8dee9", color: "#2e3440", borderRadius: "8px", fontSize: "12px", fontWeight: "bold" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="throughput"
                      stroke="#5e81ac"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#throughputGradSlideEnriched2)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Model Loss Convergence Chart */}
          <div className="bg-[#d8dee9] border border-[#e5e9f0] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#2e3440] flex items-center space-x-2">
                <TrendingDown className="w-4 h-4 text-[#87a070]" />
                <span>Loss Convergence</span>
              </h3>
              <span className="text-[10px] font-mono text-[#87a070] bg-[#eceff4] px-2.5 py-1 rounded-md border border-[#e5e9f0] font-bold">
                RL Loss
              </span>
            </div>

            <div className="h-44 w-full">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={benchmarkData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e9f0" opacity={0.9} />
                    <XAxis dataKey="step" stroke="#2e3440" fontSize={11} fontWeight={600} />
                    <YAxis stroke="#2e3440" fontSize={11} fontWeight={600} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#eceff4", borderColor: "#d8dee9", color: "#2e3440", borderRadius: "8px", fontSize: "12px", fontWeight: "bold" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="loss"
                      stroke="#a3be8c"
                      strokeWidth={3}
                      dot={{ fill: "#a3be8c", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Tech Specifications Table (4 Columns) */}
        <div className="col-span-4 bg-[#d8dee9] border border-[#e5e9f0] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#e5e9f0] pb-3 mb-3">
            <span className="text-sm font-bold text-[#2e3440] flex items-center space-x-2">
              <Server className="w-4 h-4 text-[#5e81ac]" />
              <span>Overhead & Latency Specs</span>
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="bg-[#eceff4] p-3 rounded-xl border border-[#e5e9f0] flex justify-between items-center">
              <span className="text-[#4c566a] font-medium">VRAM Direct DMA:</span>
              <span className="font-mono font-bold text-[#5e81ac] text-sm">64.8 GB/s</span>
            </div>
            <div className="bg-[#eceff4] p-3 rounded-xl border border-[#e5e9f0] flex justify-between items-center">
              <span className="text-[#4c566a] font-medium">Checkpoint Overhead:</span>
              <span className="font-mono font-bold text-[#8fbcbb] text-sm">3.2 ms / batch</span>
            </div>
            <div className="bg-[#eceff4] p-3 rounded-xl border border-[#e5e9f0] flex justify-between items-center">
              <span className="text-[#4c566a] font-medium">P2P Failover Speed:</span>
              <span className="font-mono font-bold text-[#a3be8c] text-sm">&lt; 250 ms</span>
            </div>
            <div className="bg-[#eceff4] p-3 rounded-xl border border-[#e5e9f0] flex justify-between items-center">
              <span className="text-[#4c566a] font-medium">Isolation Forest F1:</span>
              <span className="font-mono font-bold text-[#d08770] text-sm">0.994</span>
            </div>
          </div>

          <div className="pt-3 border-t border-[#e5e9f0] flex items-center space-x-2 text-xs text-[#4c566a] font-mono">
            <ShieldCheck className="w-4 h-4 text-[#a3be8c]" />
            <span>Zero-Downtime Pipeline Validated</span>
          </div>
        </div>
      </div>

      {/* Footer Banner */}
      <div className="pt-4 border-t border-[#d8dee9] flex items-center justify-between text-xs text-[#4c566a] font-medium">
        <span>Continuous JSONL Telemetry Profiling (`learning_engine_experience.jsonl`)</span>
        <span className="font-mono text-[#87a070] font-bold">Model Loss Reduced from 2.85 to 0.45</span>
      </div>
    </div>
  );
};
