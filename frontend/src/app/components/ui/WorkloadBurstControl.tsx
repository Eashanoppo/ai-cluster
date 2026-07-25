'use client';

import React, { useState } from 'react';
import { Zap, ChevronDown, ChevronUp, Loader2, Check } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type TrafficMode = 'peak' | 'off_peak';

interface TaskCounts {
  video_generation: number;
  image_generation: number;
  code_edit: number;
  batch_vision: number;
  normal_chats: number;
  large_ml_project: number;
  ocr_data_retrieval: number;
  image_editing: number;
  production_saas: number;
}

// ── Presets ───────────────────────────────────────────────────────────────────

const PRESETS: Record<TrafficMode, TaskCounts> = {
  peak: {
    video_generation: 100,
    image_generation: 250,
    code_edit: 500,
    batch_vision: 500,
    normal_chats: 2000,
    large_ml_project: 20,
    ocr_data_retrieval: 100,
    image_editing: 80,
    production_saas: 50,
  },
  off_peak: {
    video_generation: 10,
    image_generation: 25,
    code_edit: 50,
    batch_vision: 50,
    normal_chats: 200,
    large_ml_project: 3,
    ocr_data_retrieval: 15,
    image_editing: 10,
    production_saas: 5,
  },
};

const TASK_META: { key: keyof TaskCounts; label: string; icon: string; tier: number; max: number }[] = [
  { key: 'normal_chats',      label: 'Normal Chats',       icon: '💬', tier: 1, max: 5000 },
  { key: 'code_edit',         label: 'Code Editing',        icon: '💻', tier: 1, max: 2000 },
  { key: 'ocr_data_retrieval',label: 'OCR / Data Retrieval',icon: '📄', tier: 1, max: 500  },
  { key: 'image_generation',  label: 'Image Generation',    icon: '🎨', tier: 2, max: 1000 },
  { key: 'image_editing',     label: 'Image Editing',       icon: '✂️', tier: 2, max: 500  },
  { key: 'batch_vision',      label: 'Batch Vision',        icon: '🖼️', tier: 3, max: 1000 },
  { key: 'production_saas',   label: 'Production SaaS',     icon: '☁️', tier: 3, max: 200  },
  { key: 'video_generation',  label: 'Video Generation',    icon: '🎥', tier: 4, max: 500  },
  { key: 'large_ml_project',  label: 'Large ML Project',    icon: '🧠', tier: 4, max: 100  },
];

const TIER_COLORS_TEXT: Record<number, string> = {
  1: 'text-emerald-400',
  2: 'text-yellow-400',
  3: 'text-orange-400',
  4: 'text-red-400',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function WorkloadBurstControl() {
  const [mode, setMode] = useState<TrafficMode>('peak');
  const [counts, setCounts] = useState<TaskCounts>({ ...PRESETS.peak });
  const [expanded, setExpanded] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [lastResult, setLastResult] = useState<{ total: number; mode: string } | null>(null);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const switchMode = (m: TrafficMode) => {
    setMode(m);
    setCounts({ ...PRESETS[m] });
    setLastResult(null);
  };

  const handleSlider = (key: keyof TaskCounts, val: number) => {
    setCounts((prev) => ({ ...prev, [key]: val }));
    setLastResult(null);
  };

  const launch = async () => {
    setLaunching(true);
    setLastResult(null);
    try {
      const res = await fetch('/api/simulator/workload_burst/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, ...counts }),
      });
      const json = await res.json();
      // Backend wraps responses in { success: true, data: { ... } }
      const data = json.data ?? json;
      if (data.total_jobs_queued !== undefined) {
        setLastResult({ total: data.total_jobs_queued, mode });
      }
    } catch {
      // ignore
    } finally {
      setLaunching(false);
    }
  };

  return (
    <div className="card p-5 space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Workload Burst Control
          </h2>
          <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
            Generate realistic mixed workloads to showcase Tier Fit in action
          </p>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* ── Mode Toggle ── */}
      <div className="flex gap-2">
        {(['peak', 'off_peak'] as TrafficMode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`flex-1 py-2.5 text-xs font-bold font-mono uppercase tracking-wider rounded-xl border transition-all ${
              mode === m
                ? m === 'peak'
                  ? 'bg-orange-500/15 border-orange-500/50 text-orange-400'
                  : 'bg-blue-500/15 border-blue-500/50 text-blue-400'
                : 'bg-zinc-900 border-border text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {m === 'peak' ? '🔥 Peak Hours' : '🌙 Off-Peak'}
          </button>
        ))}
      </div>

      {/* ── Preview total ── */}
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-900/60 border border-border/60 rounded-xl">
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
          Total jobs to queue
        </span>
        <span className="text-sm font-black font-mono text-white">
          {total.toLocaleString()}
          <span className="text-zinc-600 font-normal text-xs"> jobs</span>
        </span>
      </div>

      {/* ── Expandable sliders ── */}
      {expanded && (
        <div className="space-y-3 border-t border-border pt-4">
          <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">
            Edit task counts per type
          </p>
          {TASK_META.map(({ key, label, icon, tier, max }) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1.5">
                  <span>{icon}</span>
                  {label}
                  <span className={`text-[8px] font-bold ${TIER_COLORS_TEXT[tier]}`}>
                    T{tier}
                  </span>
                </span>
                <span className="text-[10px] font-mono font-bold text-white w-12 text-right">
                  {counts[key].toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={max}
                step={Math.max(1, Math.floor(max / 100))}
                value={counts[key]}
                onChange={(e) => handleSlider(key, parseInt(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-zinc-800 accent-primary"
              />
            </div>
          ))}
        </div>
      )}

      {/* ── Launch button ── */}
      <button
        onClick={launch}
        disabled={launching || total === 0}
        className={`w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
          launching || total === 0
            ? 'bg-zinc-800 border border-border text-zinc-600 cursor-not-allowed'
            : 'bg-primary/15 border border-primary/60 text-primary hover:bg-primary/25 active:scale-[0.98]'
        }`}
      >
        {launching ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Queuing {total.toLocaleString()} Jobs...
          </>
        ) : lastResult ? (
          <>
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400">
              {lastResult.total.toLocaleString()} Jobs Queued ({lastResult.mode === 'peak' ? '🔥 Peak' : '🌙 Off-Peak'})
            </span>
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            Launch {mode === 'peak' ? 'Peak' : 'Off-Peak'} Burst ({total.toLocaleString()} jobs)
          </>
        )}
      </button>

      {lastResult && (
        <p className="text-[10px] font-mono text-zinc-500 text-center">
          Ray engine processing — check Placement Proof panel for results
        </p>
      )}
    </div>
  );
}
