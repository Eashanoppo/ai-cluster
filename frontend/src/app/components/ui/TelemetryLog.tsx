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

  const fetchLogs = async () => {
    try {
      const data = await pollLatestTelemetry(); // Returns the latest tick for all 5 nodes
      if (data && data.length > 0) {
        const formattedLogs = data.map((node: GpuRecord) => {
          const time = new Date(node.timestamp).toLocaleTimeString();
          const isSpike = node.temperature_celsius >= 85;
          const isIdle = node.gpu_utilization_percent < 5;

          if (isSpike) {
            return `[${time}] ⚠️ WARNING: ${node.node_id} thermal spike alert (${node.temperature_celsius.toFixed(1)}°C)`;
          } else if (isIdle) {
            return `[${time}] 💰 COSTWATCH: ${node.node_id} GPU idle (${node.gpu_utilization_percent.toFixed(0)}% util)`;
          } else {
            return `[${time}] 📊 DCGM: ${node.node_id} nominal (${node.temperature_celsius.toFixed(0)}°C, ${node.gpu_utilization_percent.toFixed(0)}% load)`;
          }
        });
        setLogs(formattedLogs);
        setError(null);
      } else {
        setError("Connection Lost");
      }
    } catch (err) {
      console.error("Failed to fetch telemetry log feed", err);
      setError("Connection Lost");
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm font-mono min-h-[160px] flex flex-col justify-center items-center text-center text-red-500">
        <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-3">
          <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span>
        </div>
        <h3 className="text-sm font-semibold text-gray-900">Live DCGM Telemetry Log</h3>
        <p className="text-xs text-red-500 mt-1">CONNECTION_LOST_RECONNECTING</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm font-mono text-slate-800 flex flex-col">
      <div className="flex justify-between items-center pb-3 border-b border-gray-150 mb-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 font-sans">Live DCGM Telemetry Log</span>
        <span className="w-2 h-2 bg-blue-500 animate-pulse rounded-full"></span>
      </div>
      <div className="flex flex-col space-y-1.5">
        {logs.slice(0, 10).map((log, i) => {
          const isWarn = log.includes('⚠️');
          const isCost = log.includes('💰');
          return (
            <div 
              key={i} 
              className={`text-xs truncate ${
                isWarn ? 'text-red-600 font-bold' : isCost ? 'text-amber-600 font-medium' : 'text-slate-500'
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

