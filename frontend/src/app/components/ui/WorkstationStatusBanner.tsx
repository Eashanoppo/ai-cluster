"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface SimRun {
  id: number;
  task_label: string;
  verdict_display: string;
  status: string;
  efficiency_pct: number;
  acknowledged: boolean;
}

const STATUS_ICONS: Record<string, string> = {
  analyzing: "⟳",
  processing: "⟳",
  completed: "✓",
  failed: "✕",
};

const STATUS_COLORS: Record<string, string> = {
  analyzing: "#88c0d0",
  processing: "#81a1c1",
  completed: "#a3be8c",
  failed: "#bf616a",
};

export default function WorkstationStatusBanner() {
  const [runs, setRuns] = useState<SimRun[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/simulator/runs/", {
          headers: { Authorization: `Bearer ${getCookie("jwt")}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const list: SimRun[] = Array.isArray(data) ? data : data?.data ?? [];
        // Show the 3 most recent runs that are not acknowledged
        setRuns(list.filter((r) => !r.acknowledged).slice(0, 3));
      } catch {
        // Silent
      }
    };

    poll();
    const interval = setInterval(poll, 15_000);
    return () => clearInterval(interval);
  }, []);

  if (runs.length === 0 || dismissed) return null;

  return (
    <div className="border-b border-border bg-surface/50 px-6 py-2 flex items-center gap-4">
      <span className="text-mono-label text-zinc-400 flex-shrink-0">WORKSTATION</span>
      <div className="flex items-center gap-3 flex-1 flex-wrap">
        {runs.map((run) => (
          <div
            key={run.id}
            className="flex items-center gap-1.5 text-xs font-mono"
          >
            <span style={{ color: STATUS_COLORS[run.status] ?? "#88c0d0" }}>
              {STATUS_ICONS[run.status] ?? "·"}
            </span>
            <span className="text-zinc-300">{run.task_label}</span>
            <span className="text-zinc-500">—</span>
            <span
              className="text-[10px] font-bold uppercase tracking-wide"
              style={{ color: STATUS_COLORS[run.status] ?? "#88c0d0" }}
            >
              {run.status === "completed" ? run.verdict_display : run.status.replace("_", " ")}
            </span>
          </div>
        ))}
      </div>
      <Link
        href="/workstation/results"
        className="text-[10px] font-mono text-zinc-500 hover:text-primary transition-colors flex-shrink-0"
      >
        VIEW ALL →
      </Link>
      <button
        onClick={() => setDismissed(true)}
        className="text-zinc-600 hover:text-zinc-400 text-sm leading-none flex-shrink-0"
        aria-label="Dismiss workstation banner"
      >
        ×
      </button>
    </div>
  );
}

function getCookie(name: string): string {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : "";
}
