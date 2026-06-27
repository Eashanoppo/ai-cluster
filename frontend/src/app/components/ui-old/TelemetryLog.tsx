'use client';

import React, { useState, useEffect } from 'react';

const MESSAGES = [
  "DCGM: Node-12 temp nominal (65C)",
  "DCGM: Node-45 memory alloc 92%",
  "[AUTO] Zombie process killed on Node-08",
  "SCHED: Pending job-892 placed on Node-03",
  "WARN: Node-14 thermal throttle imminent",
  "[AUTO] Node-19 idle. Bootstrapping Ollama L3-8B...",
  "SYS: Heartbeat OK",
  "[AUTO] OpenRouter bridge active on Node-03",
  "DCGM: Node-88 GPU util 100%",
  "NET: Infiniband fabric latency 1.2us"
];

export function TelemetryLog() {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(prev => {
        const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
        const time = new Date().toISOString().split('T')[1].slice(0, 8);
        const newLogs = [...prev, `[${time}] ${msg}`];
        if (newLogs.length > 8) newLogs.shift();
        return newLogs;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card p-4 bg-text-primary text-background font-mono h-48 overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 bg-text-primary border-b border-border p-2 z-10 flex justify-between">
        <span className="text-xs font-bold uppercase text-primary">Live DCGM Telemetry</span>
        <span className="w-2 h-2 bg-primary animate-pulse rounded-full"></span>
      </div>
      <div className="pt-8 flex flex-col justify-end h-full">
        {logs.map((log, i) => (
          <div key={i} className={`text-xs ${i === logs.length - 1 ? 'text-secondary' : 'text-gray-400 opacity-70'}`}>
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}
