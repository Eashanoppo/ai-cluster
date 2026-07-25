"use client";

import React, { useState } from "react";
import { acknowledgeSimulationRun } from "../../services/api";
import { TASK_SPECS, TIERS } from "../../services/workloadEngine";

interface SimulationRun {
  id: number;
  task_type: string;
  task_label: string;
  selected_tier: number;
  tier_name: string;
  efficiency_pct: number;
  verdict: string;
  verdict_display: string;
  status: string;
  required_nodes: number;
  allocated_nodes: number;
  bottleneck_analysis: string;
  recommendations: string[];
  demo_talking_points: string[];
  created_at: string;
  acknowledged: boolean;
  ai_raw_report?: any;
}

const VERDICT_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  optimal: { bg: "bg-[#a3be8c]/15", text: "text-[#6a9e58]", border: "border-[#a3be8c]/40" },
  overload: { bg: "bg-[#bf616a]/15", text: "text-[#bf616a]", border: "border-[#bf616a]/40" },
  idle_waste: { bg: "bg-[#ebcb8b]/15", text: "text-[#c4a84a]", border: "border-[#ebcb8b]/40" },
};

const STATUS_LABELS: Record<string, string> = {
  analyzing: "⟳ Being Analyzed",
  processing: "⟳ In Processing",
  completed: "✓ Completed",
  failed: "✕ Failed",
};

interface SimulationHistoryCardProps {
  run: SimulationRun;
  onAcknowledge?: (id: number) => void;
}

export default function SimulationHistoryCard({ run, onAcknowledge }: SimulationHistoryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [acking, setAcking] = useState(false);

  const styles = VERDICT_STYLES[run.verdict] ?? VERDICT_STYLES.optimal;
  const taskSpec = TASK_SPECS[run.task_type];
  const tierInfo = TIERS[run.selected_tier];
  const createdAt = new Date(run.created_at).toLocaleString();

  const handleAcknowledge = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setAcking(true);
    try {
      await acknowledgeSimulationRun(run.id);
      onAcknowledge?.(run.id);
    } finally {
      setAcking(false);
    }
  };

  return (
    <div className={`ws-card border ${styles.border} transition-all duration-200`}>
      {/* Summary row — always visible */}
      <button
        id={`sim-history-${run.id}`}
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center gap-4 p-4 text-left group"
      >
        {/* Task icon */}
        <span className="text-xl flex-shrink-0">{taskSpec?.icon ?? "⚙️"}</span>

        {/* Task info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-bold text-nord0">{run.task_label}</span>
            <span
              className={`ws-label-mono px-2 py-0.5 border ${styles.bg} ${styles.text} ${styles.border}`}
            >
              {run.verdict_display}
            </span>
            <span className="ws-label-mono text-nord2">
              {STATUS_LABELS[run.status] ?? run.status}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[10px] font-mono text-nord2">
              Tier {run.selected_tier} — {tierInfo?.name}
            </span>
            <span className="text-[10px] font-mono text-nord2">·</span>
            <span className="text-[10px] font-mono text-nord2">{createdAt}</span>
          </div>
        </div>

        {/* Efficiency */}
        <div className="flex flex-col items-end flex-shrink-0">
          <span
            className="font-mono text-xl font-black tabular-nums"
            style={{ color: tierInfo?.color }}
          >
            {run.efficiency_pct.toFixed(0)}%
          </span>
          <span className="text-[9px] font-mono text-nord2">utilization</span>
        </div>

        {/* Expand toggle */}
        <span className={`text-nord2 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}>
          ▸
        </span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-nord3/30 p-4 flex flex-col gap-4 animate-ws-fade-in">
          {/* Node breakdown */}
          <div className="grid grid-cols-3 gap-3">
            <div className="ws-metric-card">
              <span className="ws-label-mono text-nord2">REQUIRED</span>
              <span className="font-mono text-lg font-bold text-nord0">{run.required_nodes} nodes</span>
            </div>
            <div className="ws-metric-card">
              <span className="ws-label-mono text-nord2">ALLOCATED</span>
              <span className="font-mono text-lg font-bold text-nord0">{run.allocated_nodes} nodes</span>
            </div>
            <div className="ws-metric-card">
              <span className="ws-label-mono text-nord2">EFFICIENCY</span>
              <span className="font-mono text-lg font-bold text-nord0">{run.efficiency_pct.toFixed(1)}%</span>
            </div>
          </div>

          {/* Render generated image if present in the history card */}
          {run.ai_raw_report?.generated_image_url && (
            <div className="flex flex-col items-center gap-2 bg-ws-surface-raised p-3 border border-nord3/20 rounded-lg">
              <span className="ws-label-mono text-nord2 self-start">GENERATED ARTIFACT</span>
              <img 
                src={run.ai_raw_report.generated_image_url} 
                className="rounded-lg mt-1 border border-nord3/20 max-w-full md:max-w-md shadow-sm" 
                alt="Generated Image Output" 
              />
            </div>
          )}

          {/* Bottleneck analysis */}
          {run.bottleneck_analysis && (
            <div>
              <p className="ws-label-mono text-nord2 mb-2">ANALYSIS</p>
              <p className="text-sm font-mono text-nord1 leading-relaxed bg-ws-surface-raised p-3 border border-nord3/20">
                {run.bottleneck_analysis}
              </p>
            </div>
          )}

          {/* Recommendations */}
          {run.recommendations?.length > 0 && (
            <div>
              <p className="ws-label-mono text-nord2 mb-2">RECOMMENDATIONS</p>
              <ul className="flex flex-col gap-1.5">
                {run.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] font-mono text-nord1">
                    <span className="text-ws-teal mt-0.5 flex-shrink-0">▸</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Judge talking points */}
          {run.demo_talking_points?.length > 0 && (
            <div className="border border-ws-interactive/30 bg-ws-interactive/5 p-3">
              <p className="ws-label-mono text-ws-interactive mb-2">DEMO TALKING POINTS</p>
              <ul className="flex flex-col gap-1.5">
                {run.demo_talking_points.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] font-mono text-nord1">
                    <span className="text-ws-interactive mt-0.5 flex-shrink-0">◆</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Acknowledge button */}
          {!run.acknowledged && (
            <button
              onClick={handleAcknowledge}
              disabled={acking}
              className="ws-btn-ghost self-end text-xs"
            >
              {acking ? "Acknowledging..." : "Mark as Acknowledged"}
            </button>
          )}
          {run.acknowledged && (
            <span className="ws-label-mono text-status-optimal self-end">✓ ACKNOWLEDGED</span>
          )}
        </div>
      )}
    </div>
  );
}
