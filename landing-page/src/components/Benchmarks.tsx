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
import { Activity, Gauge, TrendingDown, Layers, Zap } from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";

const benchmarkData = [
  { step: 100, throughput: 420, latency: 18.5, loss: 2.85, efficiency: 74 },
  { step: 200, throughput: 650, latency: 15.2, loss: 2.10, efficiency: 81 },
  { step: 300, throughput: 890, latency: 12.8, loss: 1.62, efficiency: 88 },
  { step: 400, throughput: 1120, latency: 10.4, loss: 1.15, efficiency: 93 },
  { step: 500, throughput: 1380, latency: 8.9, loss: 0.78, efficiency: 96 },
  { step: 600, throughput: 1540, latency: 7.6, loss: 0.45, efficiency: 98 },
];

export const Benchmarks: React.FC = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <AnimatedSection id="benchmarks" className="py-24 border-t border-[#d8dee9]">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-4xl sm:text-5xl font-black text-[#2e3440] tracking-tight">
          Performance & Benchmarks
        </h2>
        <p className="mt-4 text-lg text-[#434c5e] leading-relaxed">
          Empirical validation demonstrating training throughput acceleration, sub-10ms latency, and model loss convergence.
        </p>
      </div>

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-[#d8dee9] border border-[#e5e9f0] rounded-2xl p-6 shadow-xs">
          <div className="flex items-center space-x-2 text-[#5e81ac] mb-3">
            <Zap className="w-5 h-5" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Peak Throughput</span>
          </div>
          <p className="text-3xl font-black text-[#2e3440]">1,540 <span className="text-xs font-normal text-[#4c566a]">samples/s</span></p>
        </div>

        <div className="bg-[#d8dee9] border border-[#e5e9f0] rounded-2xl p-6 shadow-xs">
          <div className="flex items-center space-x-2 text-[#8fbcbb] mb-3">
            <Gauge className="w-5 h-5" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Node Latency</span>
          </div>
          <p className="text-3xl font-black text-[#2e3440]">7.6 <span className="text-xs font-normal text-[#4c566a]">ms</span></p>
        </div>

        <div className="bg-[#d8dee9] border border-[#e5e9f0] rounded-2xl p-6 shadow-xs">
          <div className="flex items-center space-x-2 text-[#87a070] mb-3">
            <TrendingDown className="w-5 h-5" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Final Loss</span>
          </div>
          <p className="text-3xl font-black text-[#2e3440]">0.45 <span className="text-xs font-bold text-[#87a070]">(-84%)</span></p>
        </div>

        <div className="bg-[#d8dee9] border border-[#e5e9f0] rounded-2xl p-6 shadow-xs">
          <div className="flex items-center space-x-2 text-[#d08770] mb-3">
            <Layers className="w-5 h-5" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Efficiency</span>
          </div>
          <p className="text-3xl font-black text-[#2e3440]">98.4%</p>
        </div>
      </div>

      {/* Interactive Recharts Graphs */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Throughput vs Latency Chart */}
        <div className="bg-[#d8dee9] border border-[#e5e9f0] rounded-2xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-[#2e3440] flex items-center space-x-2">
              <Activity className="w-5 h-5 text-[#5e81ac]" />
              <span>Training Throughput (Samples/sec)</span>
            </h3>
            <span className="text-xs font-mono text-[#5e81ac] bg-[#eceff4] px-3 py-1 rounded-md border border-[#e5e9f0] font-bold">
              Cluster Scaling
            </span>
          </div>

          <div className="h-72 w-full">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={benchmarkData}>
                  <defs>
                    <linearGradient id="throughputGradLight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5e81ac" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#5e81ac" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e9f0" opacity={0.9} />
                  <XAxis dataKey="step" stroke="#2e3440" fontSize={12} fontWeight={600} />
                  <YAxis stroke="#2e3440" fontSize={12} fontWeight={600} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#eceff4", borderColor: "#d8dee9", color: "#2e3440", borderRadius: "10px", fontWeight: "bold" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="throughput"
                    stroke="#5e81ac"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#throughputGradLight)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Model Loss Convergence Chart */}
        <div className="bg-[#d8dee9] border border-[#e5e9f0] rounded-2xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-[#2e3440] flex items-center space-x-2">
              <TrendingDown className="w-5 h-5 text-[#87a070]" />
              <span>Model Loss Convergence</span>
            </h3>
            <span className="text-xs font-mono text-[#87a070] bg-[#eceff4] px-3 py-1 rounded-md border border-[#e5e9f0] font-bold">
              Experience Replay
            </span>
          </div>

          <div className="h-72 w-full">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={benchmarkData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e9f0" opacity={0.9} />
                  <XAxis dataKey="step" stroke="#2e3440" fontSize={12} fontWeight={600} />
                  <YAxis stroke="#2e3440" fontSize={12} fontWeight={600} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#eceff4", borderColor: "#d8dee9", color: "#2e3440", borderRadius: "10px", fontWeight: "bold" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="loss"
                    stroke="#a3be8c"
                    strokeWidth={3}
                    dot={{ fill: "#a3be8c", r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
};
