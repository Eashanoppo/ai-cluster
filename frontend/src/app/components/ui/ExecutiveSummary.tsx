'use client';

import React from 'react';
import { Shield, TrendingUp, Zap, Leaf, X, ChevronRight } from 'lucide-react';

interface ExecutiveSummaryProps {
  visible: boolean;
  onClose: () => void;
  data: {
    downtime_prevented_sec: number;
    gpu_hours_saved: number;
    savings_pct: number;
    baseline_monthly_usd: number;
    optimized_monthly_usd: number;
    carbon_saved_kg: number;
  };
  clusterHealth?: number;
}

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className={`bg-zinc-900/60 border border-zinc-700/50 rounded-xl p-4 flex flex-col gap-2`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <div className="text-xl font-bold text-white leading-none">{value}</div>
        {sub && <div className="text-[10px] font-mono text-zinc-500 mt-1">{sub}</div>}
      </div>
      <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">{label}</div>
    </div>
  );
}

export function ExecutiveSummary({ visible, onClose, data, clusterHealth = 98 }: ExecutiveSummaryProps) {
  if (!visible) return null;

  const savings = data.baseline_monthly_usd - data.optimized_monthly_usd;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-up">
      <div className="relative w-full max-w-lg mx-4 bg-zinc-950 border border-emerald-500/30 rounded-2xl shadow-2xl shadow-emerald-500/10 overflow-hidden">

        {/* Animated top border */}
        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-primary to-emerald-500 animate-pulse" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Shield className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">Mission Complete</div>
              <div className="text-sm text-emerald-400 font-mono">Cluster stabilized. Zero data loss.</div>
            </div>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<Shield className="w-4 h-4 text-emerald-400" />}
              label="Downtime Prevented"
              value={`${data.downtime_prevented_sec}s`}
              sub="Zero operator intervention"
              color="bg-emerald-500/10"
            />
            <StatCard
              icon={<Zap className="w-4 h-4 text-amber-400" />}
              label="GPU Hours Saved"
              value={`${data.gpu_hours_saved}`}
              sub="Autonomous reallocation"
              color="bg-amber-500/10"
            />
            <StatCard
              icon={<TrendingUp className="w-4 h-4 text-primary" />}
              label="Monthly Savings"
              value={`$${savings.toLocaleString()}`}
              sub={`${data.savings_pct}% reduction vs baseline`}
              color="bg-primary/10"
            />
            <StatCard
              icon={<Leaf className="w-4 h-4 text-emerald-300" />}
              label="Carbon Saved"
              value={`${data.carbon_saved_kg} kg CO₂`}
              sub="Idle GPU consolidation"
              color="bg-emerald-500/10"
            />
            <StatCard
              icon={<TrendingUp className="w-4 h-4 text-primary" />}
              label="Cost per 1K Tokens"
              value={`$0.0014`}
              sub="-31% via spot orchestration"
              color="bg-primary/10"
            />
            <StatCard
              icon={<Shield className="w-4 h-4 text-emerald-400" />}
              label="Cluster Uptime"
              value={`99.999%`}
              sub="Zero dropped requests"
              color="bg-emerald-500/10"
            />
          </div>

          {/* Cluster Health */}
          <div className="bg-zinc-900/60 border border-border rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Cluster Health</span>
              <span className="text-2xl font-bold text-emerald-400">{clusterHealth}%</span>
            </div>
            <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-primary rounded-full transition-all duration-1000"
                style={{ width: `${clusterHealth}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[10px] font-mono text-zinc-500">
              <span>Excellent</span>
              <span>▲ +14% since migration</span>
            </div>
          </div>

          {/* Recommendation */}
          <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-lg p-3">
            <ChevronRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-xs font-mono text-zinc-300">
              <span className="text-primary font-bold">Cluster Advisor: </span>
              No further action required. AI monitoring active. Next capacity review at 08:00.
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-primary text-black font-bold rounded-lg text-sm hover:bg-primary/90 transition-colors"
          >
            Return to Mission Control
          </button>
        </div>
      </div>
    </div>
  );
}
