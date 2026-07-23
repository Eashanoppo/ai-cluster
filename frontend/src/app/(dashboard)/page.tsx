import React from 'react';
import { ShieldAlert, DollarSign, CheckCircle, ArrowRightLeft, Thermometer, ShieldCheck, Lock } from 'lucide-react';
import { SentinelChart } from '../components/ui/Chart';
import { NodeTopology } from '../components/ui/NodeTopology';
import { TelemetryLog } from '../components/ui/TelemetryLog';
import { ApprovalGate } from '../components/ui/ApprovalGate';
import { getPredictions, getPlacements, getCostReports, getPendingApprovals, getLatestTelemetry, getLearningUpdates } from '../services/api';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export interface Prediction {
  id: number;
  node_id: string;
  failure_probability: number;
  reason: string;
}
export interface Placement {
  id: number;
  job_id: string;
  source_node: string;
  target_node: string;
}
export interface CostReport {
  id: number;
  node_id: string;
  idle_time_hours: number;
  wasted_cost_usd: string;
}
export interface ApprovalRequest {
  id: number;
  action_type: string;
  reason: string;
  status: string;
  target_resource: string;
}

export default async function DashboardOverview() {
  const cookieStore = await cookies();
  const token = cookieStore.get('jwt')?.value;

  if (!token) {
    redirect('/login');
  }

  // Fetch all backend API data concurrently
  const [predictions, placements, costs, approvals, telemetry, updates] = await Promise.all([
    getPredictions().catch(() => []),
    getPlacements().catch(() => []),
    getCostReports().catch(() => []),
    getPendingApprovals().catch(() => []),
    getLatestTelemetry().catch(() => []),
    getLearningUpdates().catch(() => [])
  ]);

  const safePredictions = Array.isArray(predictions) ? predictions : ((predictions as any).results || []);
  const safePlacements = Array.isArray(placements) ? placements : ((placements as any).results || []);
  const safeCosts = Array.isArray(costs) ? costs : ((costs as any).results || []);
  const safeApprovals = Array.isArray(approvals) ? approvals : ((approvals as any).results || []);
  const safeTelemetry = Array.isArray(telemetry) ? telemetry : [];
  const safeUpdates = Array.isArray(updates) ? updates : [];

  const totalSaved = safeCosts.reduce((acc: number, curr: CostReport) => acc + parseFloat(curr.wasted_cost_usd), 0);
  const maxTemp = safeTelemetry.length > 0 
    ? Math.max(...safeTelemetry.map(n => n.temperature_celsius)) 
    : 0;

  const projectedTemp = maxTemp > 0 ? maxTemp * 1.05 : 0;
  const backlogMins = safeApprovals.length * 2 + safePlacements.length;
  let riskLevel = 'LOW';
  if (maxTemp >= 85 || safePredictions.length > 5) {
    riskLevel = 'CRITICAL';
  } else if (maxTemp >= 75 || safePredictions.length > 0) {
    riskLevel = 'MODERATE';
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* Welcome Hero Banner with Overview Cards Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 bg-card border border-border p-6 rounded-lg animate-fade-up">
        {/* Left Side: Welcoming message */}
        <div className="xl:col-span-5 flex flex-col justify-center space-y-2">
          <h2 className="text-xl font-bold text-white tracking-tight">Welcome back, admin.</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            All system servers are operating normally. Underutilized resources are being dynamically redirected to optimize operation costs, saving <span className="text-primary font-bold">${totalSaved.toFixed(2)}</span> this period. There are currently <span className="text-amber-400 font-bold">{safeApprovals.length} approvals</span> requiring review.
          </p>
        </div>

        {/* Right Side: 2x2 Grid of KPI Cards */}
        <div className="xl:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Status card */}
          <div className="card p-4 flex items-center justify-between hover:translate-y-0">
            <div>
              <span className="block text-mono-label text-zinc-500">System Status</span>
              <span className="text-lg font-bold text-white mt-1 block">Healthy</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          {/* Peak Temp */}
          <div className="card p-4 flex items-center justify-between hover:translate-y-0">
            <div>
              <span className="block text-mono-label text-zinc-500">Peak Temperature</span>
              <span className={`text-lg font-bold mt-1 block ${maxTemp >= 85 ? 'text-red-400' : 'text-white'}`}>
                {maxTemp > 0 ? `${maxTemp.toFixed(1)}°C` : '—'}
              </span>
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${maxTemp >= 85 ? 'bg-red-500/15 text-red-400' : 'bg-primary/10 text-primary'}`}>
              <Thermometer className="w-5 h-5" />
            </div>
          </div>

          {/* Total Saved */}
          <div className="card p-4 flex items-center justify-between hover:translate-y-0">
            <div>
              <span className="block text-mono-label text-zinc-500">Total Savings</span>
              <span className="text-lg font-bold text-white mt-1 block">${totalSaved.toFixed(2)}</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          {/* Pending approvals */}
          <div className="card p-4 flex items-center justify-between hover:translate-y-0">
            <div>
              <span className="block text-mono-label text-zinc-500">Approvals Required</span>
              <span className="text-lg font-bold text-white mt-1 block">{safeApprovals.length} Pending</span>
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${safeApprovals.length > 0 ? 'bg-amber-500/15 text-amber-400' : 'bg-zinc-800/40 text-zinc-500'}`}>
              <Lock className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Left Column (Forecast & Map), Right Column (Approvals, Logs, & Reallocations) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Failure Forecast & Server Map Grid */}
        <div className="space-y-6 flex flex-col">
          
          {/* Failure Forecast */}
          <div className="card p-5 flex flex-col justify-between animate-fade-up">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-border flex-shrink-0">
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-primary" />
                  System Failure Forecast
                </h2>
                <p className="text-mono-label text-zinc-500 mt-0.5">Failure Probability Outlook</p>
              </div>
            </div>
            <div className="flex-1 min-h-[220px] h-full">
              {safePredictions.length > 0 ? (
                <SentinelChart data={safePredictions} />
              ) : (
                <div className="h-full flex items-center justify-center font-mono text-xs text-zinc-500">Awaiting system data...</div>
              )}
            </div>
          </div>

          {/* Server Map Grid */}
          <NodeTopology />
          
          {/* Digital Twin Projection View */}
          <div className="card p-5 flex flex-col animate-fade-up">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-border flex-shrink-0">
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-primary" />
                  Digital Twin Projection
                </h2>
                <p className="text-mono-label text-zinc-500 mt-0.5">Estimated state in 15 minutes</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-zinc-400">Projected Thermal Load</span>
                  <span className="text-white">{projectedTemp.toFixed(1)}°C</span>
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${projectedTemp > 85 ? 'bg-red-500' : projectedTemp > 75 ? 'bg-orange-400' : 'bg-primary'}`} style={{width: `${Math.min(100, projectedTemp)}%`}}></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900/50 p-3 rounded-lg border border-border">
                  <div className="text-xs font-mono text-zinc-500">Backlog Clear Time</div>
                  <div className="text-lg font-bold text-white mt-1">{backlogMins} Mins</div>
                </div>
                <div className="bg-zinc-900/50 p-3 rounded-lg border border-border">
                  <div className="text-xs font-mono text-zinc-500">Risk Level</div>
                  <div className={`text-lg font-bold mt-1 ${riskLevel === 'CRITICAL' ? 'text-red-500' : riskLevel === 'MODERATE' ? 'text-yellow-400' : 'text-emerald-400'}`}>{riskLevel}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Approvals, Logs, and Job Reallocations */}
        <div className="space-y-6 flex flex-col">
          
          {/* Action Approvals Center */}
          <ApprovalGate requests={safeApprovals} />

          {/* Live System Activity Logs */}
          <TelemetryLog />

          {/* Job Reallocations */}
          <div className="card p-5 flex flex-col animate-fade-up">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-border flex-shrink-0">
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <ArrowRightLeft className="w-4 h-4 text-primary" />
                  Job Reallocations
                </h2>
                <p className="text-mono-label text-zinc-500 mt-0.5">Active Task Reallocations</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {safePlacements.slice(0, 5).map((p: Placement) => (
                <div key={p.id} className="p-3 bg-surface-hover border border-border rounded-lg flex justify-between items-center text-xs font-mono">
                  <div>
                    <p className="font-bold text-white">Task {p.job_id.replace('Job-', '')}</p>
                    <p className="text-mono-label text-zinc-500 mt-0.5">
                      Move: Server {p.source_node.replace('Node-', '')} ➔ Server {p.target_node.replace('Node-', '')}
                    </p>
                  </div>
                  <CheckCircle className="w-4 h-4 text-primary" />
                </div>
              ))}
              {safePlacements.length === 0 && (
                <p className="text-center font-mono text-xs text-zinc-500 py-12">All tasks assigned. No active reallocations.</p>
              )}
            </div>
          </div>

          {/* AI Decision Center */}
          <div className="card p-5 flex flex-col animate-fade-up">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-border flex-shrink-0">
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  AI Decision Center
                </h2>
                <p className="text-mono-label text-zinc-500 mt-0.5">Explainable Learning Updates (Doc 25)</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3">
              {safeUpdates.slice(0, 10).map((update: any, idx: number) => {
                let colorClass = "bg-primary/5 border-primary/20 text-primary";
                let badgeColor = "bg-primary/10 text-primary";
                
                if (update.action === "LIVE MIGRATION" || update.action === "CAPACITY SHEDDING" || update.action === "AI AUTONOMOUS TERMINATION") {
                  colorClass = "bg-red-500/5 border-red-500/20";
                  badgeColor = "text-red-400";
                } else if (update.action === "NODE SUSPEND") {
                  colorClass = "bg-emerald-500/5 border-emerald-500/20";
                  badgeColor = "text-emerald-400";
                }
                
                return (
                  <div key={update.id || idx} className={`p-3 border rounded-lg ${colorClass}`}>
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-bold text-white">{update.action}</span>
                      <span className="text-xs text-zinc-500 font-mono">{new Date(update.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-zinc-400 mb-2">{update.reason}</p>
                    <div className="flex gap-2">
                      {update.id && <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded border border-border ${badgeColor}`}>{update.id}</span>}
                      <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-zinc-900 text-zinc-300 rounded border border-border">Target: {update.target}</span>
                      <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-zinc-900 text-zinc-300 rounded border border-border">Confidence: {update.confidence * 100}%</span>
                    </div>
                  </div>
                )
              })}
              
              {safeUpdates.length === 0 && (
                <p className="text-center font-mono text-xs text-zinc-500 py-12">No recent learning experiences logged.</p>
              )}
            </div>
          </div>

        </div>
      </div>
      
      {/* Bottom spacer for viewport breathing room */}
      <div className="h-8 flex-shrink-0" />
    </div>
  );
}

