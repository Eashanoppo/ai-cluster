'use client';

import React, { useState, useEffect, useRef } from 'react';
import { pollLatestTelemetry } from '../../actions/telemetry';
import { Thermometer, Zap, Database, Layers } from 'lucide-react';

interface TelemetryNode {
  id: number;
  node_id: string;
  temperature_celsius: number;
  vram_usage_mb: number;
  vram_total_mb: number;
  gpu_utilization_percent: number;
  power_draw_watts: number;
  timestamp: string;
}

export function NodeTopology() {
  const [nodes, setNodes] = useState<TelemetryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Tooltip state
  const [hoveredNode, setHoveredNode] = useState<TelemetryNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchTelemetry = async () => {
    try {
      const data = await pollLatestTelemetry();
      if (data && data.length > 0) {
        // Ensure sorted by Node ID (Node-001 to Node-128)
        const sorted = [...data].sort((a, b) => a.node_id.localeCompare(b.node_id));
        setNodes(sorted);
        setError(null);
      } else {
        setError("Connection Lost");
      }
    } catch (err) {
      console.error("Failed to fetch live node telemetry", err);
      setError("Connection Lost");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleNodeMouseEnter = (e: React.MouseEvent<HTMLDivElement> | React.FocusEvent<HTMLDivElement>, node: TelemetryNode) => {
    if (!containerRef.current) return;
    const cellRect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    
    setTooltipPos({
      x: cellRect.left - containerRect.left + cellRect.width / 2,
      y: cellRect.top - containerRect.top - 8,
    });
    setHoveredNode(node);
  };

  const handleNodeMouseLeave = () => {
    setHoveredNode(null);
    setTooltipPos(null);
  };

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm animate-pulse">
        <div className="h-4 bg-zinc-800 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, qi) => (
            <div key={qi} className="bg-zinc-900/35 p-4 rounded-xl border border-zinc-800/40">
              <div className="h-3 bg-zinc-800 rounded w-1/2 mb-3"></div>
              <div className="grid grid-cols-8 gap-1">
                {Array.from({ length: 32 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-zinc-800/80 rounded-sm"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface border border-red-500/30 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center font-sans h-80">
        <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mb-3">
          <Thermometer className="w-5 h-5 animate-bounce" />
        </div>
        <h3 className="text-sm font-semibold text-white">Connection Lost</h3>
        <p className="text-xs text-red-400 mt-1 max-w-[240px]">Failed to fetch live node telemetry. Reconnecting...</p>
      </div>
    );
  }

  // Count active / idle nodes
  const activeCount = nodes.filter(n => n.gpu_utilization_percent >= 5).length;
  const offCount = nodes.length - activeCount;

  // Split nodes into 4 quadrants
  const quadrants = [
    {
      id: 1,
      title: "RTX 3090 Build (Tier 1)",
      nodes: nodes.slice(0, 32),
      activeColor: "#a3be8c", // Green
      borderColor: "#88a872",
      activeText: "text-black",
    },
    {
      id: 2,
      title: "RTX 4090 Build (Tier 2)",
      nodes: nodes.slice(32, 64),
      activeColor: "#ebcb8b", // Yellow
      borderColor: "#d4b070",
      activeText: "text-black",
    },
    {
      id: 3,
      title: "RTX 5090 Build (Tier 3)",
      nodes: nodes.slice(64, 96),
      activeColor: "#d08770", // Orange
      borderColor: "#b86d56",
      activeText: "text-black",
    },
    {
      id: 4,
      title: "Blackwell B200 Build (Tier 4)",
      nodes: nodes.slice(96, 128),
      activeColor: "#bf616a", // Red
      borderColor: "#a54c54",
      activeText: "text-white",
    },
  ];

  return (
    <div ref={containerRef} className="card p-5 font-sans relative animate-fade-up delay-300">
      {/* Header section with live summaries */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 pb-4 border-b border-border">
        <div>
          <h2 className="text-sm font-semibold text-white">Cluster Map Partition</h2>
          <p className="text-mono-label text-zinc-500 mt-0.5">Hardware Quadrant Allocation</p>
        </div>
        
        {/* Status Indicators bar */}
        <div className="flex flex-wrap gap-3 font-mono text-[9px] uppercase tracking-wider font-bold">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-800/40 border border-zinc-700 text-zinc-400 rounded-lg animate-fade-up">
            <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full"></span>
            OFF / STANDBY: {offCount}
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-[#88c0d0]/10 border border-[#88c0d0]/20 text-[#88c0d0] rounded-lg animate-fade-up delay-75">
            <span className="w-1.5 h-1.5 bg-[#88c0d0] rounded-full animate-pulse"></span>
            ACTIVE SIMULATION: {activeCount}
          </div>
        </div>
      </div>

      {/* Quadrants Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full select-none">
        {quadrants.map((quad) => {
          const quadActiveCount = quad.nodes.filter(n => n.gpu_utilization_percent >= 5).length;

          return (
            <div 
              key={quad.id} 
              className={`p-4 bg-zinc-900/15 border rounded-xl flex flex-col gap-3 transition-colors ${
                quadActiveCount > 0 
                  ? "border-[#88c0d0]/20 bg-[#88c0d0]/5" 
                  : "border-border/40"
              }`}
            >
              {/* Quadrant Header */}
              <div className="flex justify-between items-center border-b border-border/20 pb-2">
                <span className="font-mono font-bold text-[10px] text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers size={11} className={quadActiveCount > 0 ? "text-[#88c0d0]" : "text-zinc-500"} />
                  {quad.title}
                </span>
                <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  {quadActiveCount} / 32 Active
                </span>
              </div>

              {/* Node Cells Sub-grid (4x8 configuration for 32 nodes) */}
              <div className="grid grid-cols-8 gap-1.5">
                {quad.nodes.map((node) => {
                  const nodeIdx = parseInt(node.node_id.replace("Node-", "")) - 1;
                  const isNodeActive = node.gpu_utilization_percent >= 5;
                  const nodeNum = node.node_id.replace("Node-", "");

                  let cellStyle: React.CSSProperties = {};
                  let cellClass = "";

                  if (isNodeActive) {
                    cellStyle = {
                      backgroundColor: quad.activeColor,
                      borderColor: quad.borderColor,
                    };
                    cellClass = `${quad.activeText} shadow-sm font-semibold scale-100 hover:scale-105`;
                    if (quad.id === 4) {
                      cellClass += " animate-pulse";
                    }
                  } else {
                    cellClass = "bg-zinc-800/40 hover:bg-zinc-800/70 text-zinc-600 border-zinc-700/50";
                  }

                  return (
                    <div
                      key={node.id}
                      tabIndex={0}
                      className={`aspect-square rounded-md flex flex-col items-center justify-center text-[9px] font-bold font-mono border transition-all duration-300 ease-in-out cursor-pointer outline-none glow-focus ${cellClass}`}
                      style={cellStyle}
                      onMouseEnter={(e) => handleNodeMouseEnter(e, node)}
                      onMouseLeave={handleNodeMouseLeave}
                      onFocus={(e) => handleNodeMouseEnter(e, node)}
                      onBlur={handleNodeMouseLeave}
                    >
                      <span>{nodeNum}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Tooltip Component */}
      {hoveredNode && tooltipPos && (
        <div
          className="absolute z-50 bg-surface/95 backdrop-blur-md text-white text-xs p-4 rounded-xl shadow-xl w-60 pointer-events-none transform -translate-x-1/2 -translate-y-full border border-border flex flex-col gap-2 font-sans transition-all duration-200 ease-out animate-ws-fade-in"
          style={{ 
            left: `${tooltipPos.x}px`, 
            top: `${tooltipPos.y}px` 
          }}
        >
          {/* Tooltip Header */}
          <div className="flex justify-between items-center border-b border-border pb-1.5 mb-1.5">
            <span className="font-mono font-bold tracking-tight text-white">{hoveredNode.node_id.replace('Node-', 'Server ')}</span>
            {hoveredNode.gpu_utilization_percent >= 5 ? (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#88c0d0] text-black">ACTIVE</span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">STANDBY</span>
            )}
          </div>

          {/* Stats Rows */}
          <div className="grid grid-cols-2 gap-y-2 gap-x-3">
            {/* Temp */}
            <div className="flex items-center gap-1.5">
              <Thermometer className={`w-3.5 h-3.5 ${hoveredNode.gpu_utilization_percent >= 5 ? 'text-[#88c0d0]' : 'text-zinc-400'}`} />
              <div>
                <span className="block text-[8px] text-zinc-400 font-mono uppercase tracking-wider">Temperature</span>
                <span className={`text-[11px] font-bold font-mono ${hoveredNode.gpu_utilization_percent >= 5 ? 'text-[#88c0d0]' : 'text-zinc-200'}`}>
                  {hoveredNode.temperature_celsius.toFixed(1)}°C
                </span>
              </div>
            </div>

            {/* Util */}
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-zinc-400" />
              <div>
                <span className="block text-[8px] text-zinc-400 font-mono uppercase tracking-wider">Load</span>
                <span className="text-[11px] font-bold font-mono text-zinc-200">
                  {hoveredNode.gpu_utilization_percent.toFixed(0)}%
                </span>
              </div>
            </div>

            {/* VRAM */}
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-zinc-400" />
              <div>
                <span className="block text-[8px] text-zinc-400 font-mono uppercase tracking-wider">Memory</span>
                <span className="text-[11px] font-bold font-mono text-zinc-200">
                  {(hoveredNode.vram_usage_mb / 1024).toFixed(1)} GB
                </span>
              </div>
            </div>

            {/* Power */}
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-zinc-400" />
              <div>
                <span className="block text-[8px] text-zinc-400 font-mono uppercase tracking-wider">Power</span>
                <span className="text-[11px] font-bold font-mono text-zinc-200">
                  {hoveredNode.power_draw_watts.toFixed(0)}W
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
