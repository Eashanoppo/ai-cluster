"use client";

import React, { useState, useEffect } from "react";
import { getSimulationRuns } from "../../../services/api";
import SimulationHistoryCard from "../../../components/workstation/SimulationHistoryCard";

export default function SimulationResultsPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "optimal" | "overload" | "idle_waste">("all");

  useEffect(() => {
    const load = async () => {
      const hasJwt = typeof document !== 'undefined' && document.cookie.includes('jwt=');
      if (!hasJwt) {
        window.location.href = '/login';
        return;
      }

      try {
        const data = await getSimulationRuns();
        setRuns(Array.isArray(data) ? data : []);
      } catch (err: any) {
        if (err?.message === "Unauthorized") {
          window.location.href = '/login';
          return;
        }
        setRuns([]);
      } finally {
        setLoading(false);
      }
    };
    load();
    // Poll every 10s to catch newly completed runs
    const interval = setInterval(load, 10_000);
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledge = (id: number) => {
    setRuns((prev) =>
      prev.map((r) => (r.id === id ? { ...r, acknowledged: true } : r))
    );
  };

  const filtered = filter === "all" ? runs : runs.filter((r) => r.verdict === filter);

  const stats = {
    total: runs.length,
    optimal: runs.filter((r) => r.verdict === "optimal").length,
    overload: runs.filter((r) => r.verdict === "overload").length,
    idle: runs.filter((r) => r.verdict === "idle_waste").length,
    avgEfficiency:
      runs.length > 0
        ? runs.reduce((acc, r) => acc + r.efficiency_pct, 0) / runs.length
        : 0,
  };

  return (
    <div className="max-w-[1000px] mx-auto w-full p-6 flex flex-col gap-5">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-nord0 tracking-tight">Simulation History</h1>
        <p className="text-sm text-nord2 font-mono mt-0.5">
          All past cluster allocation decisions and their AI-generated analysis reports.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="TOTAL RUNS" value={stats.total.toString()} />
        <StatCard label="OPTIMAL" value={stats.optimal.toString()} valueColor="#a3be8c" />
        <StatCard label="OVERLOADED" value={stats.overload.toString()} valueColor="#bf616a" />
        <StatCard
          label="AVG EFFICIENCY"
          value={`${stats.avgEfficiency.toFixed(0)}%`}
          valueColor="#5e81ac"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-0 border border-nord3/40 self-start">
        {(["all", "optimal", "overload", "idle_waste"] as const).map((f) => {
          const labels = { all: "ALL", optimal: "OPTIMAL", overload: "OVERLOAD", idle_waste: "IDLE WASTE" };
          return (
            <button
              key={f}
              id={`filter-${f}`}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-[10px] font-mono font-bold border-r border-nord3/40 last:border-r-0 transition-colors ${
                filter === f
                  ? "bg-ws-interactive text-white"
                  : "text-nord2 hover:text-nord0 hover:bg-ws-surface-raised"
              }`}
            >
              {labels[f]}
            </button>
          );
        })}
      </div>

      {/* Runs list */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="ws-card h-16 animate-pulse bg-ws-surface-raised" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="ws-card p-12 flex flex-col items-center gap-3 text-center">
          <span className="text-3xl">⊘</span>
          <p className="font-mono text-sm text-nord2">
            {runs.length === 0
              ? "No simulations yet. Go to the Workstation to run your first allocation."
              : `No ${filter.replace("_", " ")} results found.`}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((run) => (
            <SimulationHistoryCard
              key={run.id}
              run={run}
              onAcknowledge={handleAcknowledge}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  valueColor = "#2e3440",
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="ws-card p-3 flex flex-col gap-1">
      <span className="ws-label-mono text-nord2">{label}</span>
      <span className="font-mono text-2xl font-black tabular-nums" style={{ color: valueColor }}>
        {value}
      </span>
    </div>
  );
}
