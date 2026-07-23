"use client";

import React, { useState, useEffect } from "react";
import { getTopology, getDashboardMetrics } from "../../services/api";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from "recharts";
import { Server, Activity, Brain, ShieldAlert, Cpu, ActivitySquare } from "lucide-react";

export default function GrafanaDashboard() {
  const [topology, setTopology] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const top = await getTopology();
        const met = await getDashboardMetrics();
        setTopology(top);
        setMetrics(met);
      } catch (e) {
        console.error("Dashboard fetch error", e);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!topology || !metrics) {
    return (
      <div className="flex items-center justify-center h-full text-nord4 font-mono">
        <Activity className="animate-spin w-5 h-5 mr-3" /> Syncing Digital Twin Telemetry...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto hide-scrollbar">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-nord4 flex items-center gap-2">
            <ActivitySquare className="text-ws-interactive" /> 
            Digital Twin Analytics
          </h1>
          <p className="text-sm text-nord4/60 mt-1">Simulated Prometheus & Kubernetes Metrics</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="bg-ws-surface px-4 py-2 rounded-lg border border-border">
            Total Saved: <span className="text-nord14 font-bold">${metrics.total_cost_saved_usd}</span>
          </div>
          <div className="bg-ws-surface px-4 py-2 rounded-lg border border-border">
            Load: <span className="text-ws-interactive font-bold">{metrics.cluster_load_pct}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ML Anomaly Trend */}
        <div className="lg:col-span-2 bg-ws-surface rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-nord4 mb-4 flex items-center gap-2">
            <Brain className="w-4 h-4 text-nord15" /> Failure Prediction Engine (IsolationForest)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.ml_anomaly_trend}>
                <defs>
                  <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#bf616a" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#bf616a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#4c566a" opacity={0.2} vertical={false} />
                <XAxis dataKey="time" stroke="#d8dee9" fontSize={11} tickMargin={10} />
                <YAxis stroke="#d8dee9" fontSize={11} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#2e3440', borderColor: '#4c566a' }}
                  itemStyle={{ color: '#d8dee9' }}
                />
                <Area type="monotone" dataKey="probability" stroke="#bf616a" fillOpacity={1} fill="url(#colorProb)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Learning Engine Status */}
        <div className="bg-ws-surface rounded-xl border border-border p-5 space-y-4">
          <h3 className="text-sm font-semibold text-nord4 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-nord13" /> Learning Engine
          </h3>
          <div className="p-4 bg-ws-bg rounded-lg border border-border/50">
            <div className="text-xs font-mono text-nord4/60 mb-1">Experiences Logged</div>
            <div className="text-2xl font-bold text-nord4">{metrics.learning_engine.experiences_logged}</div>
          </div>
          <div className="p-4 bg-ws-bg rounded-lg border border-border/50">
            <div className="text-xs font-mono text-nord4/60 mb-1">Model Confidence</div>
            <div className="text-2xl font-bold text-ws-interactive">{metrics.learning_engine.model_confidence}%</div>
          </div>
          <p className="text-xs text-nord4/50 pt-2 leading-relaxed">
            The learning engine continuously evaluates autonomous decisions to adjust scheduling weights.
          </p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Topology Map (Kubernetes / Ray Nodes) */}
        <div className="bg-ws-surface rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-nord4 mb-4 flex items-center gap-2">
            <Server className="w-4 h-4 text-nord8" /> Kubernetes Topology
          </h3>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-64 overflow-y-auto hide-scrollbar pr-2">
            {topology.nodes.map((n: any) => (
              <div 
                key={n.id} 
                className={`p-2 rounded border text-center relative ${
                  n.status === 'Cordoned' ? 'bg-nord11/10 border-nord11/50 text-nord11' : 
                  n.temperature > 85 ? 'bg-nord12/10 border-nord12/50 text-nord12' : 
                  'bg-ws-bg border-border text-nord4'
                }`}
              >
                <Cpu className="w-4 h-4 mx-auto mb-1 opacity-70" />
                <div className="text-[10px] font-mono truncate">{n.id}</div>
                <div className="text-[9px] font-bold mt-1">{n.temperature}°C</div>
                {n.status === 'Cordoned' && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-nord11 rounded-full animate-ping"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Workloads and Migrations */}
        <div className="bg-ws-surface rounded-xl border border-border p-5 flex flex-col">
          <h3 className="text-sm font-semibold text-nord4 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-nord14" /> Live Migrations (Evictions)
          </h3>
          <div className="space-y-3 flex-1 overflow-y-auto hide-scrollbar">
            {topology.migrations.length === 0 ? (
              <div className="text-xs text-nord4/40 font-mono italic p-4 text-center">No recent migrations.</div>
            ) : (
              topology.migrations.map((m: any, i: number) => (
                <div key={i} className="p-3 bg-ws-bg border border-border/50 rounded-lg text-xs font-mono">
                  <div className="text-nord14 mb-1">{m.job}</div>
                  <div className="flex items-center gap-2 text-nord4/70">
                    <span>{m.from}</span>
                    <span className="text-nord3">→</span>
                    <span>{m.to}</span>
                  </div>
                  <div className="text-nord11 mt-1 text-[10px]">{m.reason}</div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
