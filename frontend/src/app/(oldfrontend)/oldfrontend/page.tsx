import React from 'react';
import { ShieldAlert, Cpu, Activity, DollarSign, CheckCircle, ArrowRightLeft } from 'lucide-react';
import { SentinelChart } from '../../components/ui-old/Chart';
import { CopilotChat } from '../../components/ui-old/Copilot';
import { NodeTopology } from '../../components/ui-old/NodeTopology';
import { TelemetryLog } from '../../components/ui-old/TelemetryLog';
import { ApprovalGate } from '../../components/ui-old/ApprovalGate';
import { getPredictions, getPlacements, getCostReports, getPendingApprovals } from '../../services/api';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { logoutAction } from '../../actions/auth';

export interface Prediction {
  id: number;
  failure_probability: number;
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
}

export default async function OldDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get('jwt')?.value;

  if (!token) {
    redirect('/login');
  }

  // Fetch real data from Django API concurrently
  const [predictions, placements, costs, approvals] = await Promise.all([
    getPredictions().catch(() => []),
    getPlacements().catch(() => []),
    getCostReports().catch(() => []),
    getPendingApprovals().catch(() => [])
  ]);

  const safePredictions = Array.isArray(predictions) ? predictions : ((predictions as any).results || []);
  const safePlacements = Array.isArray(placements) ? placements : ((placements as any).results || []);
  const safeCosts = Array.isArray(costs) ? costs : ((costs as any).results || []);
  const safeApprovals = Array.isArray(approvals) ? approvals : ((approvals as any).results || []);

  const hasPredictions = safePredictions.length > 0;
  const latestPrediction = hasPredictions ? safePredictions[0] : null;
  const isCritical = latestPrediction?.failure_probability > 0.8;

  const totalSaved = safeCosts.reduce((acc: number, curr: CostReport) => acc + parseFloat(curr.wasted_cost_usd), 0);

  return (
    <div className="min-h-screen p-4 font-sans bg-background text-text-primary selection:bg-primary selection:text-text-primary">
      {/* Header */}
      <header className="flex justify-between items-center mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 border-2 border-text-primary bg-primary flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
            <Cpu className="text-text-primary w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-serif tracking-tight">NeuronOps_ (Legacy)</h1>
            <p className="font-mono text-xs uppercase tracking-widest text-text-secondary">SYS.INTELLIGENCE.LAYER</p>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <div className="px-4 py-1 border border-border bg-primary text-text-primary font-mono text-xs font-bold flex items-center gap-2 uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
            <span className="w-2 h-2 bg-text-primary animate-pulse"></span>
            AUTONOMY: ON
          </div>
          <form action={logoutAction}>
             <button type="submit" className="font-mono text-xs uppercase underline hover:text-primary transition-colors">Term_Session</button>
          </form>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        
        {/* Left Column - Live Monitoring */}
        <div className="xl:col-span-1 flex flex-col gap-4">
          <NodeTopology />
          <TelemetryLog />
          <div className="card p-4">
            <div className="flex justify-between items-start mb-2 border-b border-border pb-2">
              <p className="font-mono text-xs font-bold uppercase">Identified Waste</p>
              <DollarSign className="text-primary w-4 h-4" />
            </div>
            <h3 className="text-3xl font-serif font-bold">${totalSaved.toFixed(2)}</h3>
            <p className="font-mono text-[10px] text-text-secondary mt-1">CAPACITY_RECLAIMABLE</p>
          </div>
        </div>

        {/* Center Column - Intelligence & Actions */}
        <div className="xl:col-span-2 flex flex-col gap-4">
          {/* Sentinel Chart */}
          <div className="card p-4 h-64 flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b border-border pb-2">
              <div>
                <h2 className="font-mono text-sm font-bold flex items-center gap-2 uppercase">
                  <ShieldAlert className="w-4 h-4 text-primary" />
                  Thermal.Prediction.Model
                </h2>
              </div>
            </div>
            <div className="flex-1 w-full">
              {hasPredictions ? (
                <SentinelChart data={safePredictions} />
              ) : (
                <div className="h-full flex items-center justify-center font-mono text-xs text-text-secondary">AWAITING_TELEMETRY_SYNC...</div>
              )}
            </div>
          </div>

          {/* Scheduler & CostWatch Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-4 h-[250px] overflow-hidden flex flex-col">
               <h2 className="font-mono text-sm font-bold flex items-center gap-2 mb-4 border-b border-border pb-2 uppercase">
                  <ArrowRightLeft className="w-4 h-4 text-secondary" />
                  Scheduler.Actions
                </h2>
                <div className="flex-1 overflow-y-auto space-y-2">
                  {safePlacements.length > 0 ? safePlacements.map((p: Placement) => (
                    <div key={p.id} className="p-2 bg-surface-hover border border-border flex justify-between items-center font-mono text-xs">
                      <div>
                        <p className="font-bold text-text-primary">{p.job_id}</p>
                        <p className="text-[10px] text-text-secondary">MIGRATE: {p.source_node} → {p.target_node}</p>
                      </div>
                      <CheckCircle className="w-3 h-3 text-secondary" />
                    </div>
                  )) : (
                     <p className="font-mono text-xs text-text-secondary">SYS.IDLE</p>
                  )}
                </div>
            </div>

            <div className="card p-4 h-[250px] overflow-hidden flex flex-col">
               <h2 className="font-mono text-sm font-bold flex items-center gap-2 mb-4 border-b border-border pb-2 uppercase">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Autonomous.Fleet (Local LLMs)
                </h2>
                <div className="flex-1 overflow-y-auto space-y-2">
                  {safeCosts.length > 0 ? safeCosts.map((c: CostReport) => (
                    <div key={c.id} className="p-2 bg-surface border border-primary font-mono text-xs">
                      <p className="font-bold text-primary">IDLE DETECTED: {c.node_id}</p>
                      <p className="text-[10px] text-text-secondary mb-2">{c.idle_time_hours}H WASTE → REDIRECTED TO OLLAMA</p>
                      <div className="w-full text-[10px] px-2 py-1 bg-primary text-text-primary uppercase font-bold flex justify-between items-center">
                        <span>[AUTO] PROVISIONING...</span>
                        <span className="w-1.5 h-1.5 bg-text-primary rounded-full animate-ping"></span>
                      </div>
                    </div>
                  )) : (
                    <p className="font-mono text-xs text-text-secondary">NO_WASTE_DETECTED</p>
                  )}
                </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Copilot Terminal & Execution Gate */}
        <div className="xl:col-span-1 flex flex-col gap-4">
          <ApprovalGate requests={safeApprovals} />
          <CopilotChat />
        </div>

      </div>
    </div>
  );
}
