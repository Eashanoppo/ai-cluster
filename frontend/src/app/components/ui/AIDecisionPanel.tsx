'use client';

import React from 'react';
import { CheckCircle, AlertTriangle, Brain } from 'lucide-react';

interface ConfidenceBreakdown {
  scheduling_confidence: number;
  thermal_prediction: number;
  resource_availability: number;
  historical_accuracy: number;
  final_confidence: number;
}

interface SchedulingReason {
  icon: string;
  text: string;
  weight: number;
}

interface AIDecisionPanelProps {
  selectedNode: string;
  selectedNodeName: string;
  reasons: SchedulingReason[];
  confidenceBreakdown: ConfidenceBreakdown;
  visible: boolean;
}

function ConfidenceBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">{label}</span>
        <span className="text-[10px] font-mono font-bold text-white">{value}%</span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function AIDecisionPanel({ selectedNode, selectedNodeName, reasons, confidenceBreakdown, visible }: AIDecisionPanelProps) {
  if (!visible) return null;

  const { scheduling_confidence, thermal_prediction, resource_availability, historical_accuracy, final_confidence } = confidenceBreakdown;

  // Compute pie-slice weights for the scoring graph
  const total = reasons.reduce((s, r) => s + r.weight, 0);
  const weightLabels = [
    { label: 'Queue', pct: Math.round((reasons[0]?.weight / total) * 100) || 35, color: 'bg-primary' },
    { label: 'Memory', pct: Math.round((reasons[2]?.weight / total) * 100) || 31, color: 'bg-emerald-400' },
    { label: 'Thermal', pct: Math.round((reasons[1]?.weight / total) * 100) || 23, color: 'bg-amber-400' },
    { label: 'Speed', pct: Math.round((reasons[3]?.weight / total) * 100) || 11, color: 'bg-violet-400' },
  ];

  return (
    <div className="bg-zinc-950/90 backdrop-blur-sm border border-primary/30 rounded-xl p-5 space-y-5 animate-fade-up shadow-2xl shadow-primary/10">
      
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
          <Brain className="w-4 h-4 text-primary" />
        </div>
        <div>
          <div className="text-xs font-bold text-white uppercase tracking-wider">AI Decision Engine</div>
          <div className="text-[10px] text-zinc-500 font-mono">IsolationForest v2.1 · Cluster Twin Analysis</div>
        </div>
        <div className="ml-auto px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
          <span className="text-[10px] font-mono font-bold text-emerald-400">DECISION LOGGED</span>
        </div>
      </div>

      {/* Selected Node */}
      <div className="bg-zinc-900/60 border border-border rounded-lg p-3">
        <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-1">Selected GPU Node</div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-white">{selectedNodeName}</span>
            <span className="ml-2 text-sm font-mono text-zinc-400">({selectedNode})</span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{final_confidence}%</div>
            <div className="text-[10px] text-zinc-500 font-mono">Confidence</div>
          </div>
        </div>
      </div>

      {/* Reasons */}
      <div className="space-y-2">
        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Decision Factors</div>
        {reasons.map((r, i) => (
          <div key={i} className="flex items-start gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span className="text-xs text-zinc-300 font-mono">{r.text}</span>
          </div>
        ))}
      </div>

      {/* Confidence Breakdown */}
      <div className="space-y-2.5">
        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">AI Confidence Derived From</div>
        <ConfidenceBar label="Scheduling Model" value={scheduling_confidence} color="bg-primary" />
        <ConfidenceBar label="Thermal Prediction" value={thermal_prediction} color="bg-amber-400" />
        <ConfidenceBar label="Resource Availability" value={resource_availability} color="bg-emerald-400" />
        <ConfidenceBar label="Historical Accuracy" value={historical_accuracy} color="bg-violet-400" />
        <div className="mt-1 pt-2 border-t border-border flex justify-between items-center">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Final Confidence Score</span>
          <span className="text-base font-bold text-primary">{final_confidence}%</span>
        </div>
      </div>

      {/* Scoring Graph (weight bars) */}
      <div className="space-y-2">
        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Decision Weight Breakdown</div>
        <div className="flex gap-1 h-8 rounded overflow-hidden">
          {weightLabels.map((w, i) => (
            <div
              key={i}
              className={`${w.color} flex items-center justify-center transition-all duration-500`}
              style={{ width: `${w.pct}%` }}
              title={`${w.label}: ${w.pct}%`}
            >
              <span className="text-[8px] font-bold text-black leading-none hidden sm:block">{w.pct}%</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between">
          {weightLabels.map((w, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-sm ${w.color}`} />
              <span className="text-[9px] font-mono text-zinc-500">{w.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
