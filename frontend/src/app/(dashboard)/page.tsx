'use client';

import React, { useState, useCallback } from 'react';
import { NodeTopology } from '../components/ui/NodeTopology';
import { TelemetryLog } from '../components/ui/TelemetryLog';
import { ApprovalGate } from '../components/ui/ApprovalGate';
import { ClusterHealthScore } from '../components/ui/ClusterHealthScore';
import { MissionTimeline } from '../components/ui/MissionTimeline';
import { JudgeMode } from '../components/ui/JudgeMode';
import { ClusterAdvisor } from '../components/ui/ClusterAdvisor';
import { SentinelChart } from '../components/ui/Chart';
import ComparisonModal from '../components/ui/ComparisonModal';
import { pollPredictions, pollApprovals, pollLearningUpdates } from '../actions/simulator';

// ─────────────────────────────────────────────────────────────
// NOTE: This page is a 'use client' component so all data
// fetching happens inside child components via polling.
// Server-side data is handled individually per component.
// ─────────────────────────────────────────────────────────────

export default function MissionControl() {
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  const handleTimelineEvent = useCallback((event: any) => {
    setTimelineEvents(prev => [event, ...prev].slice(0, 40));
  }, []);

  return (
    <div className="space-y-5 font-sans pb-8 relative">
      {/* ── TOP ACTION BAR ── */}
      <div className="flex justify-end">
        <button 
          onClick={() => setShowComparison(true)}
          className="px-4 py-2 bg-primary/20 border border-primary text-primary text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-primary/30 transition-colors"
        >
          Compare vs Traditional Scheduler
        </button>
      </div>

      {showComparison && <ComparisonModal onClose={() => setShowComparison(false)} />}

      {/* ── TOP STRIP: Cluster Health + Judge Mode ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Cluster Health Score — hero metric (left) */}
        <div className="lg:col-span-5">
          <ClusterHealthScore />
        </div>

        {/* Judge Mode — right of health score */}
        <div className="lg:col-span-4">
          <JudgeMode onTimelineEvent={handleTimelineEvent} />
        </div>

        {/* Cluster Advisor */}
        <div className="lg:col-span-3">
          <ClusterAdvisor />
        </div>
      </div>

      {/* ── MAIN AREA: Digital Twin + Right Column ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

        {/* Left: Digital Twin + Failure Forecast */}
        <div className="xl:col-span-8 space-y-5">

          {/* Digital Cluster Twin — the hero visual */}
          <NodeTopology />

          {/* Failure Forecast Chart */}
          <FailureForecastCard />

        </div>

        {/* Right: Mission Timeline + Approval Gate */}
        <div className="xl:col-span-4 space-y-5 flex flex-col">
          <div className="flex-1 min-h-[400px]">
            <MissionTimeline injectedEvents={timelineEvents} />
          </div>
          <ApprovalGateWrapper />
        </div>
      </div>

      {/* ── BOTTOM ROW: AI Decision Center + Telemetry ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <AIDecisionCenter />
        <TelemetryLog />
      </div>

    </div>
  );
}

// ─── Sub-components (no extra files needed — inline for this page) ────────────

function FailureForecastCard() {
  const [predictions, setPredictions] = useState<any[]>([]);

  React.useEffect(() => {
    const fetch = async () => {
      const data = await pollPredictions();
      setPredictions(data);
    };
    fetch();
    const id = setInterval(fetch, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="card p-5">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-border">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            Predictive Failure Analysis
          </h2>
          <p className="text-mono-label text-zinc-500 mt-0.5">IsolationForest anomaly scores · 5-min outlook</p>
        </div>
        <div className="text-right">
          <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Model</div>
          <div className="text-[10px] font-mono font-bold text-primary">sklearn v1.5</div>
        </div>
      </div>
      <div className="min-h-[200px]">
        {predictions.length > 0 ? (
          <SentinelChart data={predictions} />
        ) : (
          <div className="h-48 flex items-center justify-center font-mono text-xs text-zinc-600">
            Awaiting anomaly data...
          </div>
        )}
      </div>
    </div>
  );
}

function ApprovalGateWrapper() {
  const [approvals, setApprovals] = useState<any[]>([]);

  React.useEffect(() => {
    const fetch = async () => {
      const data = await pollApprovals();
      setApprovals(data);
    };
    fetch();
    const id = setInterval(fetch, 3000);
    return () => clearInterval(id);
  }, []);

  return <ApprovalGate requests={approvals} />;
}

function AIDecisionCenter() {
  const [updates, setUpdates] = useState<any[]>([]);

  React.useEffect(() => {
    const fetch = async () => {
      const data = await pollLearningUpdates();
      setUpdates(data);
    };
    fetch();
    const id = setInterval(fetch, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="card p-5 flex flex-col">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-border flex-shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            AI Decision Center
          </h2>
          <p className="text-mono-label text-zinc-500 mt-0.5">Explainable learning engine · every decision logged</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2.5 max-h-80">
        {updates.slice(0, 12).map((u: any, i: number) => {
          const isMigration = u.action?.includes('MIGRATION');
          const isCritical = u.action?.includes('KILL') || u.action?.includes('TERMINATE');
          const isSuspend = u.action?.includes('SUSPEND');

          return (
            <div
              key={`${u.id}-${i}`}
              className={`p-3 border rounded-lg ${
                isMigration ? 'bg-blue-500/5 border-blue-500/20' :
                isCritical  ? 'bg-red-500/5 border-red-500/20' :
                isSuspend   ? 'bg-emerald-500/5 border-emerald-500/20' :
                              'bg-primary/5 border-primary/20'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`text-xs font-bold ${
                  isMigration ? 'text-blue-300' :
                  isCritical  ? 'text-red-300' :
                  isSuspend   ? 'text-emerald-300' :
                                'text-white'
                }`}>{u.action}</span>
                <span className="text-[10px] font-mono text-zinc-500 flex-shrink-0">
                  {new Date(u.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                </span>
              </div>
              <p className="text-[11px] font-mono text-zinc-400 mb-2 leading-relaxed">{u.reason}</p>
              <div className="flex flex-wrap gap-1.5">
                {u.id && (
                  <span className="px-2 py-0.5 text-[9px] font-bold font-mono uppercase tracking-wider bg-zinc-900 border border-zinc-700 text-zinc-400 rounded">
                    {u.id}
                  </span>
                )}
                <span className="px-2 py-0.5 text-[9px] font-bold font-mono uppercase tracking-wider bg-zinc-900 border border-zinc-700 text-zinc-400 rounded">
                  {u.target}
                </span>
                <span className="px-2 py-0.5 text-[9px] font-bold font-mono uppercase tracking-wider bg-zinc-900 border border-zinc-700 text-emerald-400 rounded">
                  {(u.confidence * 100).toFixed(0)}% confidence
                </span>
              </div>
            </div>
          );
        })}
        {updates.length === 0 && (
          <p className="text-center font-mono text-xs text-zinc-600 py-8">No AI decisions logged yet.</p>
        )}
      </div>
    </div>
  );
}
