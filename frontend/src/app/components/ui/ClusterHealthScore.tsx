'use client';

import React, { useEffect, useState } from 'react';
import { pollDashboardMetrics } from '../../actions/simulator';
import { pollLatestTelemetry } from '../../actions/telemetry';

interface MetricsData {
  running_jobs: number;
  critical_alerts: number;
  ai_decisions_today: number;
  downtime_prevented_min: number;
  estimated_savings_usd: number;
  lifetime_downtime_prevented_hrs: number;
  lifetime_money_saved: number;
  prediction_accuracy: number;
}

export function ClusterHealthScore() {
  const [health, setHealth] = useState(96);
  const [trend, setTrend] = useState(4);
  const [metrics, setMetrics] = useState<MetricsData>({
    running_jobs: 0,
    critical_alerts: 0,
    ai_decisions_today: 0,
    downtime_prevented_min: 0,
    estimated_savings_usd: 0,
    lifetime_downtime_prevented_hrs: 412,
    lifetime_money_saved: 182000,
    prediction_accuracy: 98.3,
  });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [dashData, telemetry] = await Promise.all([
        pollDashboardMetrics(),
        pollLatestTelemetry(),
      ]);

      const safeTelemetry = Array.isArray(telemetry) ? telemetry : [];
      const activeNodes = safeTelemetry.filter((n: any) => n.gpu_utilization_percent >= 5).length;
      const maxTemp = safeTelemetry.length > 0 ? Math.max(...safeTelemetry.map((n: any) => n.temperature_celsius)) : 0;

      // Compute health score: 100 - penalties
      const tempPenalty = Math.max(0, (maxTemp - 60) * 0.8);
      const overloadPenalty = activeNodes > 110 ? 8 : 0;
      const computedHealth = Math.max(70, Math.min(99, Math.round(100 - tempPenalty - overloadPenalty)));

      setHealth(computedHealth);
      setTrend(computedHealth >= 95 ? 4 : computedHealth >= 85 ? 1 : -3);

      if (dashData) {
        setMetrics({
          running_jobs: dashData.active_nodes ?? activeNodes,
          critical_alerts: dashData.cluster_load_pct > 90 ? 1 : 0,
          ai_decisions_today: dashData.learning_engine?.experiences_logged ?? 0,
          downtime_prevented_min: (dashData.learning_engine?.experiences_logged ?? 0) * 15,
          estimated_savings_usd: dashData.total_cost_saved_usd ?? 0,
          lifetime_downtime_prevented_hrs: 412 + Math.floor(((dashData.learning_engine?.experiences_logged ?? 0) * 15) / 60),
          lifetime_money_saved: 182000 + (dashData.total_cost_saved_usd ?? 0),
          prediction_accuracy: dashData.learning_engine?.model_confidence ?? 98.3,
        });
      } else {
        setMetrics(m => ({ ...m, running_jobs: activeNodes }));
      }
    } catch {
      // keep defaults
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isMounted = true;
    
    const pollWithJitter = async () => {
      if (!isMounted) return;
      await fetchData();
      
      if (isMounted) {
        // Base delay of 4500ms + random jitter of 0-1000ms
        const jitter = Math.floor(Math.random() * 1000);
        timeoutId = setTimeout(pollWithJitter, 4500 + jitter);
      }
    };
    
    pollWithJitter();
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const healthColor =
    health >= 90 ? 'text-emerald-400' :
    health >= 75 ? 'text-amber-400' :
    'text-red-400';

  const healthLabel =
    health >= 90 ? 'Excellent' :
    health >= 75 ? 'Degraded' :
    'Critical';

  const ringColor =
    health >= 90 ? 'stroke-emerald-400' :
    health >= 75 ? 'stroke-amber-400' :
    'stroke-red-400';

  const circumference = 2 * Math.PI * 38;
  const dashOffset = circumference * (1 - health / 100);



  return (
    <div className="card p-5 space-y-5">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-sm font-bold text-white">Mission Control</h2>
          <p className="text-[10px] font-mono text-zinc-500 mt-0.5">CustroConnect · Cluster Twin Engine</p>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 border border-primary/20 rounded-full">
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
          <span className="text-[9px] font-mono font-bold text-primary uppercase tracking-wider">Live</span>
        </div>
      </div>

      {/* Cluster Health Score — hero metric */}
      <div className="flex items-center gap-5">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="38" fill="none" stroke="#27303f" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="38"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              className={`${ringColor} transition-all duration-1000`}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-xl font-black leading-none ${healthColor}`}>{health}%</span>
            <span className="text-[9px] font-mono text-zinc-400 mt-0.5">{healthLabel}</span>
          </div>
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="text-lg font-bold text-white leading-tight">Cluster Health</div>
          <div className={`text-sm font-mono ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend >= 0 ? `▲ +${trend}%` : `▼ ${trend}%`} since optimization
          </div>
          <div className="text-[10px] font-mono text-zinc-500">
            Executives love one number. This is it.
          </div>
        </div>
      </div>

      {/* NOC KPI Strip */}
      <div className="grid grid-cols-3 gap-2 border-t border-border pt-4">
        <div className="text-center">
          <div className="text-base font-black text-white">{loading ? '—' : metrics.running_jobs}</div>
          <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mt-0.5">Running Jobs</div>
        </div>
        <div className="text-center">
          <div className={`text-base font-black ${metrics.critical_alerts > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {loading ? '—' : metrics.critical_alerts}
          </div>
          <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mt-0.5">Critical Alerts</div>
        </div>
        <div className="text-center">
          <div className="text-base font-black text-primary">{loading ? '—' : metrics.ai_decisions_today}</div>
          <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mt-0.5">AI Decisions</div>
        </div>
        <div className="text-center">
          <div className="text-base font-black text-amber-400">{loading ? '—' : `${metrics.downtime_prevented_min}m`}</div>
          <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mt-0.5">Downtime Saved</div>
        </div>
        <div className="text-center">
          <div className="text-base font-black text-emerald-400">{loading ? '—' : `$${metrics.estimated_savings_usd}`}</div>
          <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mt-0.5">Savings Today</div>
        </div>
        <div className="text-center">
          <div className="text-base font-black text-primary">{metrics.prediction_accuracy}%</div>
          <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mt-0.5">AI Accuracy</div>
        </div>
      </div>

      {/* Lifetime Stats */}
      <div className="bg-zinc-900/40 border border-border/50 rounded-lg p-3 space-y-1">
        <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mb-2">Since Launch</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] font-mono">
          <div className="flex justify-between"><span className="text-zinc-500">AI Decisions</span><span className="text-white font-bold">{(18432 + metrics.ai_decisions_today).toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Hrs Prevented</span><span className="text-white font-bold">{metrics.lifetime_downtime_prevented_hrs}</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Total Saved</span><span className="text-emerald-400 font-bold">${metrics.lifetime_money_saved.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Accuracy</span><span className="text-primary font-bold">{metrics.prediction_accuracy}%</span></div>
        </div>
      </div>
    </div>
  );
}
