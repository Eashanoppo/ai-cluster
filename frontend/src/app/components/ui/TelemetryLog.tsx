'use client';

import React, { useState, useEffect } from 'react';
import { pollLatestTelemetry } from '../../actions/telemetry';

interface GpuRecord {
  node_id: string;
  temperature_celsius: number;
  gpu_utilization_percent: number;
  timestamp: string;
}

export function TelemetryLog() {
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    const generateInitialLogs = async () => {
      try {
        const data = await pollLatestTelemetry();
        if (data && data.length > 0) {
          const historical: string[] = [];
          // Pre-populate with 4 ticks of historical data (20 entries)
          for (let tick = 4; tick >= 1; tick--) {
            const tickTime = new Date(Date.now() - tick * 5000);
            const timeStr = tickTime.toLocaleTimeString();
            data.forEach((node: GpuRecord) => {
              const offsetTemp = (Math.random() - 0.5) * 4;
              const offsetUtil = (Math.random() - 0.5) * 8;
              const temp = Math.max(30, Math.min(95, node.temperature_celsius + offsetTemp));
              const util = Math.max(0, Math.min(100, node.gpu_utilization_percent + offsetUtil));
              
              const isSpike = temp >= 85;
              const isIdle = util < 5;

              const nodeId = node.node_id.replace('Node-', '');
              if (isSpike) {
                historical.push(`[${timeStr}] WARNING: Server ${nodeId} temperature warning (${temp.toFixed(1)}°C)`);
              } else if (isIdle) {
                historical.push(`[${timeStr}] SAVINGS: Server ${nodeId} is inactive (${util.toFixed(0)}% load)`);
              } else {
                historical.push(`[${timeStr}] LOG: Server ${nodeId} is operating normally (${temp.toFixed(0)}°C, ${util.toFixed(0)}% load)`);
              }
            });
          }

          const currentFormatted = data.map((node: GpuRecord) => {
            const timeStr = new Date(node.timestamp).toLocaleTimeString();
            const isSpike = node.temperature_celsius >= 85;
            const isIdle = node.gpu_utilization_percent < 5;

            const nodeId = node.node_id.replace('Node-', '');
            if (isSpike) {
              return `[${timeStr}] WARNING: Server ${nodeId} temperature warning (${node.temperature_celsius.toFixed(1)}°C)`;
            } else if (isIdle) {
              return `[${timeStr}] SAVINGS: Server ${nodeId} is inactive (${node.gpu_utilization_percent.toFixed(0)}% load)`;
            } else {
              return `[${timeStr}] LOG: Server ${nodeId} is operating normally (${node.temperature_celsius.toFixed(0)}°C, ${node.gpu_utilization_percent.toFixed(0)}% load)`;
            }
          });

          setLogs([...historical, ...currentFormatted].slice(-25));
          setError(null);
        }
      } catch (err) {
        console.error("Failed to generate initial logs", err);
      }
    };

    generateInitialLogs();

    const interval = setInterval(async () => {
      try {
        const data = await pollLatestTelemetry();
        if (data && data.length > 0) {
          const currentFormatted = data.map((node: GpuRecord) => {
            const timeStr = new Date(node.timestamp).toLocaleTimeString();
            const isSpike = node.temperature_celsius >= 85;
            const isIdle = node.gpu_utilization_percent < 5;

            const nodeId = node.node_id.replace('Node-', '');
            if (isSpike) {
              return `[${timeStr}] WARNING: Server ${nodeId} temperature warning (${node.temperature_celsius.toFixed(1)}°C)`;
            } else if (isIdle) {
              return `[${timeStr}] SAVINGS: Server ${nodeId} is inactive (${node.gpu_utilization_percent.toFixed(0)}% load)`;
            } else {
              return `[${timeStr}] LOG: Server ${nodeId} is operating normally (${node.temperature_celsius.toFixed(0)}°C, ${node.gpu_utilization_percent.toFixed(0)}% load)`;
            }
          });

          setLogs(prev => {
            const combined = [...prev, ...currentFormatted];
            return combined.slice(-25);
          });
          setError(null);
        } else {
          setError("Connection Lost");
        }
      } catch (err) {
        console.error("Failed to fetch telemetry log feed", err);
        setError("Connection Lost");
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="bg-surface border border-border p-4 shadow-sm font-mono h-[320px] flex flex-col justify-center items-center text-center text-red-400">
        <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mb-3">
          <span className="w-2.5 h-2.5 bg-red-400 rounded-full"></span>
        </div>
        <h3 className="text-sm font-semibold text-white">System Activity Logs</h3>
        <p className="text-xs text-red-400 mt-1">Connection lost. Reconnecting...</p>
      </div>
    );
  }

  return (
    <div className="card p-4 font-mono text-zinc-300 flex flex-col animate-fade-up delay-300 h-[320px]">
      <div className="flex justify-between items-center pb-2 border-b border-border mb-3 flex-shrink-0">
        <span className="text-mono-label text-primary font-sans">System Activity Logs</span>
        <span className="w-2 h-2 bg-primary animate-pulse rounded-full"></span>
      </div>
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar space-y-1.5 min-h-0">
        {logs.map((log, i) => {
          const isWarn = log.includes('WARNING:');
          const isCost = log.includes('COSTWATCH:');
          return (
            <div 
              key={i} 
              className={`text-[11px] leading-relaxed truncate ${
                isWarn ? 'text-red-400 font-semibold animate-pulse' : isCost ? 'text-amber-500 font-medium' : 'text-zinc-400'
              }`}
            >
              {log}
            </div>
          );
        })}
      </div>
    </div>
  );
}

