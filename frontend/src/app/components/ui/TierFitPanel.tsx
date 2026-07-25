'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BrainCircuit, Zap, Shield, TrendingDown, Clock, ChevronDown, RefreshCw, Activity } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface TierFitSummary {
  total_jobs: number;
  clustroconnect_cost_usd: number;
  first_free_cost_usd: number;
  total_saving_usd: number;
  savings_pct: number;
  avg_wait_clustroconnect: number;
  avg_wait_first_free: number;
  avg_tier_fit_score: number;
  top_tier_preserved: boolean;
}

interface TierRow {
  tier: number;
  tier_name: string;
  cost_per_node_hr: number;
  jobs: number;
  avg_score: number;
  our_total_cost: number;
  naive_total_cost: number;
}

interface Placement {
  id: number;
  run_id: number | null;
  task_type: string;
  selected_tier: number;
  tier_name: string;
  tier_fit_score: number;
  reason_line: string;
  cost_per_hour_usd: number;
  first_free_tier: number;
  first_free_cost_usd: number;
  cost_saving_usd: number;
  wait_time_seconds: number;
  first_free_wait_seconds: number;
  top_tier_preserved: boolean;
  traffic_mode: string;
  created_at: string;
}

interface SimHistoryEntry {
  run_id: number;
  task_type: string;
  created_at: string | null;
  traffic_mode: string;
  job_count: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TIER_COLORS: Record<number, string> = {
  1: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  2: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  3: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  4: 'text-red-400 bg-red-500/10 border-red-500/30',
};

const TIER_BAR_COLORS: Record<number, string> = {
  1: 'bg-emerald-500',
  2: 'bg-yellow-500',
  3: 'bg-orange-500',
  4: 'bg-red-500',
};

const TASK_ICONS: Record<string, string> = {
  video_generation: '🎥',
  image_generation: '🎨',
  code_edit: '💻',
  normal_chats: '💬',
  batch_vision: '🖼️',
  large_ml_project: '🧠',
  ocr_data_retrieval: '📄',
  image_editing: '✂️',
  production_saas: '☁️',
};

const TASK_LABELS: Record<string, string> = {
  video_generation: 'Video Generation',
  image_generation: 'Image Generation',
  code_edit: 'Code Editing',
  normal_chats: 'Normal Chats',
  batch_vision: 'Batch Vision',
  large_ml_project: 'Large ML Project',
  ocr_data_retrieval: 'OCR Retrieval',
  image_editing: 'Image Editing',
  production_saas: 'Production SaaS',
};

// ── Main Component ─────────────────────────────────────────────────────────────

export default function TierFitPanel() {
  const [summary, setSummary] = useState<TierFitSummary | null>(null);
  const [byTier, setByTier] = useState<TierRow[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [simHistory, setSimHistory] = useState<SimHistoryEntry[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>('');
  const [trafficMode, setTrafficMode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: '25' });
      if (selectedRunId) params.set('run_id', selectedRunId);
      if (trafficMode) params.set('mode', trafficMode);

      const res = await fetch(`/api/simulator/tier_fit/?${params.toString()}`);
      if (!res.ok) return;
      const json = await res.json();
      // Backend wraps responses: { success: true, data: { ... } }
      const data = json.data ?? json;

      setSummary(data.summary);
      setByTier(data.by_tier || []);
      setPlacements(data.recent_placements || []);
      setSimHistory(data.simulation_history || []);
      setLastUpdated(new Date());
    } catch {
      // silent — backend may be restarting
    } finally {
      setLoading(false);
    }
  }, [selectedRunId, trafficMode]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 4000);
    return () => clearInterval(id);
  }, [fetchData]);

  return (
    <div className="card p-5 space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Placement Proof
            <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 ml-1">
              Tier Fit & Cost Comparison
            </span>
          </h2>
          <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
            Proves every job landed on the cheapest GPU tier that meets its need
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-[9px] font-mono text-zinc-600">
              {lastUpdated.toLocaleTimeString('en-US', { hour12: false })}
            </span>
          )}
          <button
            onClick={fetchData}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Filters: Simulation History Dropdown + Traffic Mode ── */}
      <div className="flex gap-3 flex-wrap">
        {/* Simulation History */}
        <div className="flex-1 min-w-[160px]">
          <label className="block text-[9px] font-mono uppercase tracking-widest text-zinc-500 mb-1">
            Simulation Run
          </label>
          <div className="relative">
            <select
              value={selectedRunId}
              onChange={(e) => setSelectedRunId(e.target.value)}
              className="w-full appearance-none bg-zinc-900 border border-border text-zinc-300 text-xs font-mono rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-primary/60 cursor-pointer"
            >
              <option value="">All Runs (Live)</option>
              {simHistory.map((h) => (
                <option key={h.run_id} value={String(h.run_id)}>
                  Run #{h.run_id} — {TASK_LABELS[h.task_type] || h.task_type} ({h.job_count} jobs)
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
          </div>
        </div>

        {/* Traffic Mode Filter */}
        <div>
          <label className="block text-[9px] font-mono uppercase tracking-widest text-zinc-500 mb-1">
            Traffic Mode
          </label>
          <div className="flex gap-1.5">
            {[
              { value: '', label: 'ALL' },
              { value: 'peak', label: 'PEAK' },
              { value: 'off_peak', label: 'OFF-PEAK' },
              { value: 'manual', label: 'MANUAL' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTrafficMode(opt.value)}
                className={`px-2.5 py-1.5 text-[9px] font-bold font-mono uppercase tracking-wider rounded border transition-colors ${
                  trafficMode === opt.value
                    ? 'bg-primary/20 border-primary/60 text-primary'
                    : 'bg-zinc-900 border-border text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : summary && summary.total_jobs > 0 ? (
        <>
          {/* ── Summary Strip ── */}
          <SummaryStrip summary={summary} />

          {/* ── Per-Tier Breakdown ── */}
          {byTier.length > 0 && <TierScoreboard byTier={byTier} />}

          {/* ── Recent Placements Feed ── */}
          {placements.length > 0 && <PlacementsFeed placements={placements} />}
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

// ── Summary Strip ──────────────────────────────────────────────────────────────

function SummaryStrip({ summary }: { summary: TierFitSummary }) {
  const metrics = [
    {
      label: 'Total Jobs',
      value: summary.total_jobs.toLocaleString(),
      icon: <Activity className="w-4 h-4" />,
      color: 'text-primary',
    },
    {
      label: 'Cost Saved',
      value: `$${summary.total_saving_usd.toFixed(2)}`,
      sub: `${summary.savings_pct}% vs naive`,
      icon: <TrendingDown className="w-4 h-4" />,
      color: 'text-emerald-400',
    },
    {
      label: 'Avg Wait',
      value: `${summary.avg_wait_clustroconnect.toFixed(1)}s`,
      sub: `vs ${summary.avg_wait_first_free.toFixed(1)}s (naive)`,
      icon: <Clock className="w-4 h-4" />,
      color: 'text-yellow-400',
    },
    {
      label: 'Tier Fit Score',
      value: `${summary.avg_tier_fit_score.toFixed(0)}/100`,
      icon: <BrainCircuit className="w-4 h-4" />,
      color: 'text-primary',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="bg-zinc-900/80 border border-border rounded-xl p-3 flex items-center gap-3"
        >
          <div className={`${m.color} opacity-80`}>{m.icon}</div>
          <div>
            <div className={`text-base font-black font-mono ${m.color}`}>{m.value}</div>
            {m.sub && <div className="text-[9px] text-zinc-600 font-mono">{m.sub}</div>}
            <div className="text-[9px] uppercase tracking-wider text-zinc-500">{m.label}</div>
          </div>
        </div>
      ))}

      {/* Tier 4 Preserved badge */}
      <div
        className={`col-span-2 lg:col-span-4 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border ${
          summary.top_tier_preserved
            ? 'bg-emerald-500/5 border-emerald-500/25'
            : 'bg-zinc-900 border-border'
        }`}
      >
        <Shield
          className={`w-4 h-4 ${summary.top_tier_preserved ? 'text-emerald-400' : 'text-zinc-600'}`}
        />
        {summary.top_tier_preserved ? (
          <span className="text-xs font-mono text-emerald-300">
            <span className="font-bold">✓ Tier 4 (Blackwell B200) RESERVED</span>
            {' — '}heavy ML/video jobs had access; lighter jobs were blocked from using premium hardware
          </span>
        ) : (
          <span className="text-xs font-mono text-zinc-600">
            Tier 4 reservation not yet triggered — run a workload burst to activate
          </span>
        )}
      </div>
    </div>
  );
}

// ── Tier Scoreboard ───────────────────────────────────────────────────────────

function TierScoreboard({ byTier }: { byTier: TierRow[] }) {
  return (
    <div>
      <h3 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
        Per-Tier Breakdown
      </h3>
      <div className="space-y-2">
        {byTier.map((row) => {
          const saving = row.naive_total_cost - row.our_total_cost;
          return (
            <div
              key={row.tier}
              className="flex items-center gap-3 p-3 bg-zinc-900/60 border border-border/60 rounded-xl"
            >
              {/* Tier badge */}
              <div
                className={`flex-shrink-0 w-14 text-center px-2 py-1 rounded-lg border text-[10px] font-bold font-mono ${TIER_COLORS[row.tier]}`}
              >
                T{row.tier}
              </div>

              {/* Name + jobs */}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-zinc-300 truncate">{row.tier_name}</div>
                <div className="text-[10px] font-mono text-zinc-500">
                  {row.jobs.toLocaleString()} jobs · ${row.cost_per_node_hr}/hr per node
                </div>
              </div>

              {/* Score bar */}
              <div className="w-20 flex-shrink-0">
                <div className="flex justify-between text-[9px] font-mono text-zinc-500 mb-0.5">
                  <span>Fit Score</span>
                  <span className="text-white font-bold">{row.avg_score.toFixed(0)}</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${TIER_BAR_COLORS[row.tier]}`}
                    style={{ width: `${row.avg_score}%` }}
                  />
                </div>
              </div>

              {/* Cost comparison */}
              <div className="text-right flex-shrink-0">
                <div className="text-xs font-mono font-bold text-white">
                  ${row.our_total_cost.toFixed(2)}
                </div>
                {saving > 0 && (
                  <div className="text-[9px] font-mono text-emerald-400">
                    +${saving.toFixed(2)} saved
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Placements Feed ───────────────────────────────────────────────────────────

function PlacementsFeed({ placements }: { placements: Placement[] }) {
  return (
    <div>
      <h3 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
        Recent Placement Decisions
      </h3>
      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {placements.map((p) => {
          const saving = p.cost_saving_usd;
          const scoreColor =
            p.tier_fit_score >= 90
              ? 'text-emerald-400'
              : p.tier_fit_score >= 60
              ? 'text-yellow-400'
              : 'text-red-400';

          return (
            <div
              key={p.id}
              className="p-3 bg-zinc-900/50 border border-border/50 rounded-xl hover:border-primary/30 transition-colors"
            >
              {/* Top row */}
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-base">{TASK_ICONS[p.task_type] || '⚙️'}</span>
                <span className="text-xs font-medium text-zinc-200">
                  {TASK_LABELS[p.task_type] || p.task_type}
                </span>

                {/* Tier badge */}
                <span
                  className={`px-2 py-0.5 text-[9px] font-bold font-mono uppercase border rounded ${TIER_COLORS[p.selected_tier]}`}
                >
                  {p.tier_name}
                </span>

                {/* Traffic mode badge */}
                <span
                  className={`px-1.5 py-0.5 text-[8px] font-bold font-mono uppercase rounded border ${
                    p.traffic_mode === 'peak'
                      ? 'border-orange-500/40 text-orange-400 bg-orange-500/5'
                      : p.traffic_mode === 'off_peak'
                      ? 'border-blue-500/40 text-blue-400 bg-blue-500/5'
                      : 'border-zinc-700 text-zinc-500'
                  }`}
                >
                  {p.traffic_mode === 'off_peak' ? 'off-peak' : p.traffic_mode}
                </span>

                {p.top_tier_preserved && (
                  <span className="px-1.5 py-0.5 text-[8px] font-bold font-mono uppercase rounded border border-emerald-500/40 text-emerald-400 bg-emerald-500/5">
                    T4 Preserved ✓
                  </span>
                )}

                <div className="ml-auto flex items-center gap-1.5">
                  {/* Fit Score */}
                  <span className={`text-[10px] font-bold font-mono ${scoreColor}`}>
                    {p.tier_fit_score.toFixed(0)}/100
                  </span>
                  <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        p.tier_fit_score >= 90
                          ? 'bg-emerald-500'
                          : p.tier_fit_score >= 60
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${p.tier_fit_score}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Reason line */}
              <p className="text-[10px] font-mono text-zinc-400 leading-relaxed mb-2 border-l-2 border-zinc-700 pl-2">
                {p.reason_line || '—'}
              </p>

              {/* Cost comparison row */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-[9px] font-mono">
                  <span className="text-zinc-600">CustroConnect:</span>
                  <span className="text-primary font-bold">${p.cost_per_hour_usd.toFixed(2)}/hr</span>
                  <span className="text-zinc-700 mx-1">vs</span>
                  <span className="text-zinc-600">First-Free:</span>
                  <span className="text-zinc-400">${p.first_free_cost_usd.toFixed(2)}/hr</span>
                  {saving > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded font-bold">
                      −${saving.toFixed(2)} saved
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-mono ml-auto">
                  <Clock className="w-3 h-3 text-zinc-600" />
                  <span className="text-zinc-500">
                    {p.wait_time_seconds.toFixed(1)}s vs {p.first_free_wait_seconds.toFixed(1)}s
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-zinc-800/50 rounded-xl" />
        ))}
      </div>
      <div className="h-24 bg-zinc-800/50 rounded-xl" />
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-zinc-800/50 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
      <Zap className="w-10 h-10 text-zinc-700" />
      <p className="text-sm font-mono text-zinc-600">No placement data yet</p>
      <p className="text-[11px] font-mono text-zinc-700 max-w-xs">
        Launch a workload burst from the control panel above to generate Tier Fit placement records.
      </p>
    </div>
  );
}
