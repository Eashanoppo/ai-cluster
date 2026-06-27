import React from 'react';
import { ShieldAlert, Cpu, Activity, DollarSign, CheckCircle, ArrowRightLeft, Thermometer, ShieldCheck, Lock } from 'lucide-react';
import { SentinelChart } from '../components/ui/Chart';
import { NodeTopology } from '../components/ui/NodeTopology';
import { TelemetryLog } from '../components/ui/TelemetryLog';
import { ApprovalGate } from '../components/ui/ApprovalGate';
import { getPredictions, getPlacements, getCostReports, getPendingApprovals, getLatestTelemetry } from '../services/api';
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
  const [predictions, placements, costs, approvals, telemetry] = await Promise.all([
    getPredictions().catch(() => []),
    getPlacements().catch(() => []),
    getCostReports().catch(() => []),
    getPendingApprovals().catch(() => []),
    getLatestTelemetry().catch(() => [])
  ]);

  const safePredictions = Array.isArray(predictions) ? predictions : ((predictions as any).results || []);
  const safePlacements = Array.isArray(placements) ? placements : ((placements as any).results || []);
  const safeCosts = Array.isArray(costs) ? costs : ((costs as any).results || []);
  const safeApprovals = Array.isArray(approvals) ? approvals : ((approvals as any).results || []);
  const safeTelemetry = Array.isArray(telemetry) ? telemetry : [];

  const totalSaved = safeCosts.reduce((acc: number, curr: CostReport) => acc + parseFloat(curr.wasted_cost_usd), 0);
  const maxTemp = safeTelemetry.length > 0 
    ? Math.max(...safeTelemetry.map(n => n.temperature_celsius)) 
    : 0;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Overview Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Status card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-bold text-gray-400 font-mono uppercase tracking-wider">Fleet Status</span>
            <span className="text-2xl font-bold text-gray-900 mt-1 block">Nominal</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Max Temp */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-bold text-gray-400 font-mono uppercase tracking-wider">Max GPU Temp</span>
            <span className={`text-2xl font-bold mt-1 block ${maxTemp >= 85 ? 'text-red-500' : 'text-gray-900'}`}>
              {maxTemp > 0 ? `${maxTemp.toFixed(1)}°C` : '—'}
            </span>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${maxTemp >= 85 ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
            <Thermometer className="w-6 h-6" />
          </div>
        </div>

        {/* Wasted Cost */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-bold text-gray-400 font-mono uppercase tracking-wider">Reclaimed Waste</span>
            <span className="text-2xl font-bold text-gray-900 mt-1 block">${totalSaved.toFixed(2)}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Pending approvals */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-bold text-gray-400 font-mono uppercase tracking-wider">Execution Gate</span>
            <span className="text-2xl font-bold text-gray-900 mt-1 block">{safeApprovals.length} Pending</span>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${safeApprovals.length > 0 ? 'bg-amber-50 text-amber-500' : 'bg-gray-50 text-gray-400'}`}>
            <Lock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Row 1: GPU Fleet Node Status (128 Nodes) & Sentinel Chart (50/50 split) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Node Status Grid */}
        <NodeTopology />

        {/* Sentinel Prediction Chart */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100 flex-shrink-0">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-blue-500" />
                Cluster Thermal.Prediction.Model
              </h2>
              <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mt-0.5">Failure Probability Forecast</p>
            </div>
          </div>
          <div className="flex-1 min-h-[200px] h-full">
            {safePredictions.length > 0 ? (
              <SentinelChart data={safePredictions} />
            ) : (
              <div className="h-full flex items-center justify-center font-mono text-xs text-gray-400">AWAITING TELEMETRY...</div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Scheduler Migrations, Live DCGM Telemetry Log, & Execution Gate (33/33/33 split) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Workload Scheduler */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100 flex-shrink-0">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4 text-blue-500" />
                Scheduler Migrations
              </h2>
              <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mt-0.5">Automated Workload Routing</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2">
            {safePlacements.slice(0, 5).map((p: Placement) => (
              <div key={p.id} className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex justify-between items-center text-xs font-mono">
                <div>
                  <p className="font-bold text-gray-800">{p.job_id}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">MIGRATE: {p.source_node} → {p.target_node}</p>
                </div>
                <CheckCircle className="w-4 h-4 text-blue-500" />
              </div>
            ))}
            {safePlacements.length === 0 && (
              <p className="text-center font-mono text-xs text-gray-400 py-12">SYS.IDLE (No placements active)</p>
            )}
          </div>
        </div>

        {/* Live DCGM Telemetry Log (now white card background) */}
        <TelemetryLog />

        {/* Execution Gate */}
        <ApprovalGate requests={safeApprovals} />

      </div>
    </div>
  );
}
