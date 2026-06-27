'use client';

import React, { useState, useEffect, useRef } from 'react';
import { pollLatestTelemetry } from '../../actions/telemetry';
import { Thermometer, Zap, Database } from 'lucide-react';

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
        setNodes(data);
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
    const interval = setInterval(fetchTelemetry, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleNodeMouseEnter = (e: React.MouseEvent<HTMLDivElement> | React.FocusEvent<HTMLDivElement>, node: TelemetryNode) => {
    if (!containerRef.current) return;
    const cellRect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Position tooltip above the hovered node cell center
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
        <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5">
          {Array.from({ length: 128 }).map((_, i) => (
            <div key={i} className="aspect-square bg-zinc-900 rounded-lg"></div>
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

  // Count metrics for quick indicators
  const spikingCount = nodes.filter(n => n.temperature_celsius >= 85).length;
  const idleCount = nodes.filter(n => n.gpu_utilization_percent < 5).length;
  const nominalCount = nodes.length - spikingCount - idleCount;

  return (
    <div ref={containerRef} className="card p-5 font-sans relative animate-fade-up delay-300">
      {/* Header section with inline summaries */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 pb-4 border-b border-border">
        <div>
          <h2 className="text-sm font-semibold text-white">GPU Fleet Node Status (128 Nodes)</h2>
          <p className="text-mono-label text-zinc-400 mt-0.5">Live Grid Observability</p>
        </div>
        
        {/* Status Indicators bar */}
        <div className="flex flex-wrap gap-3 font-mono text-[9px] uppercase tracking-wider font-bold">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-800/40 border border-zinc-700 text-zinc-400 rounded-lg animate-fade-up">
            <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full"></span>
            Idle: {idleCount}
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 border border-primary/20 text-primary rounded-lg animate-fade-up delay-75">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
            Nominal: {nominalCount}
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/15 border border-red-500/30 text-red-400 rounded-lg animate-fade-up delay-150">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
            Critical: {spikingCount}
          </div>
        </div>
      </div>

      {/* Grid container */}
      <div className="grid grid-cols-[repeat(16,minmax(0,1fr))] md:grid-cols-[repeat(8,minmax(0,1fr))] gap-1 md:gap-1.5 select-none w-full">
        {nodes.map((node) => {
          const isSpike = node.temperature_celsius >= 85;
          const isIdle = node.gpu_utilization_percent < 5;
          const nodeNum = node.node_id.replace("Node-", "");

          let cellClass = "";
          if (isSpike) {
            cellClass = "bg-red-500 hover:bg-red-600 text-white border-red-600 shadow-md shadow-red-950 ring-2 ring-red-500/30 ring-offset-0 animate-pulse";
          } else if (isIdle) {
            cellClass = "bg-zinc-800 hover:bg-zinc-700/80 text-zinc-550 border-zinc-700";
          } else {
            cellClass = "bg-primary hover:bg-primary-hover text-black border-primary font-semibold";
          }

          return (
            <div
              key={node.id}
              tabIndex={0}
              className={`w-3.5 h-3.5 rounded-none md:w-full md:h-7 md:rounded-none flex items-center justify-center md:justify-between px-0 md:px-2 text-[9px] font-bold font-mono border transition-all duration-300 ease-in-out cursor-pointer hover:scale-105 hover:z-10 outline-none glow-focus ${cellClass}`}
              onMouseEnter={(e) => handleNodeMouseEnter(e, node)}
              onMouseLeave={handleNodeMouseLeave}
              onFocus={(e) => handleNodeMouseEnter(e, node)}
              onBlur={handleNodeMouseLeave}
            >
              {/* On desktop: show node suffix */}
              <span className="hidden md:inline">{nodeNum}</span>
              {/* On desktop: show summary metrics */}
              <span className="hidden lg:inline text-[8px] opacity-90 font-medium">
                {node.temperature_celsius.toFixed(0)}°|{node.gpu_utilization_percent.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Floating Tooltip Component */}
      {hoveredNode && tooltipPos && (
        <div
          className="absolute z-50 bg-surface/95 backdrop-blur-md text-white text-xs p-4 rounded-xl shadow-xl w-60 pointer-events-none transform -translate-x-1/2 -translate-y-full border border-border flex flex-col gap-2 font-sans transition-all duration-200 ease-out"
          style={{ 
            left: `${tooltipPos.x}px`, 
            top: `${tooltipPos.y}px` 
          }}
        >
          {/* Tooltip Header */}
          <div className="flex justify-between items-center border-b border-border pb-1.5 mb-1.5">
            <span className="font-mono font-bold tracking-tight text-white">{hoveredNode.node_id}</span>
            {hoveredNode.temperature_celsius >= 85 ? (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-red-500 text-white animate-pulse">CRITICAL</span>
            ) : hoveredNode.gpu_utilization_percent < 5 ? (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">IDLE</span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-primary text-black">NOMINAL</span>
            )}
          </div>

          {/* Stats Rows */}
          <div className="grid grid-cols-2 gap-y-2 gap-x-3">
            {/* Temp */}
            <div className="flex items-center gap-1.5">
              <Thermometer className={`w-3.5 h-3.5 ${hoveredNode.temperature_celsius >= 85 ? 'text-red-400' : 'text-zinc-400'}`} />
              <div>
                <span className="block text-[8px] text-zinc-400 font-mono uppercase tracking-wider">Temp</span>
                <span className={`text-[11px] font-bold font-mono ${hoveredNode.temperature_celsius >= 85 ? 'text-red-400' : 'text-zinc-200'}`}>
                  {hoveredNode.temperature_celsius.toFixed(1)}°C
                </span>
              </div>
            </div>

            {/* Util */}
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-zinc-400" />
              <div>
                <span className="block text-[8px] text-zinc-400 font-mono uppercase tracking-wider">Util</span>
                <span className="text-[11px] font-bold font-mono text-zinc-200">
                  {hoveredNode.gpu_utilization_percent.toFixed(0)}%
                </span>
              </div>
            </div>

            {/* VRAM */}
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-zinc-400" />
              <div>
                <span className="block text-[8px] text-zinc-400 font-mono uppercase tracking-wider">VRAM</span>
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

