import React from 'react';
import { DollarSign, Cpu, History, CheckCircle } from 'lucide-react';
import { getCostReports } from '../../services/api';
import { CostReportsTable } from '../../components/ui/CostReportsTable';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function CostWatchPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('jwt')?.value;

  if (!token) {
    redirect('/login');
  }

  // Fetch cost reports
  const costs = await getCostReports().catch(() => []);
  const safeCosts = Array.isArray(costs) ? costs : ((costs as any).results || []);

  const totalSaved = safeCosts.reduce((acc: number, curr: any) => acc + parseFloat(curr.wasted_cost_usd), 0);
  const idleNodes = Array.from(new Set<string>(safeCosts.map((c: any) => c.node_id as string)));

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Header Summary */}
      <div className="card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white leading-none tracking-tight">Savings Manager</h2>
          <p className="text-xs text-zinc-400 mt-1.5">Monitors inactive servers and redirects resource power to local assistant models</p>
        </div>
        <div className="flex gap-3">
          <span className="font-mono text-xs font-bold px-3 py-1.5 bg-primary/10 text-primary rounded-xl border border-primary/20 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4" />
            ${totalSaved.toFixed(2)} Total Savings Reclaimed
          </span>
        </div>
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2/3 width) - Cost Reports History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5">
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-border">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <History className="w-4 h-4 text-primary" />
                  Inactive Capacity Reports
                </h3>
                <p className="text-[10px] text-zinc-455 font-mono uppercase tracking-wider mt-0.5">Logs of inactive servers flagged for assistant model tasks</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <CostReportsTable reports={safeCosts} />
            </div>
          </div>
        </div>

        {/* Right Column (1/3 width) - Ollama Fleet Provisioning status */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-white mb-4 pb-3 border-b border-border flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-primary" />
              Assistant Task Allocation
            </h3>
            
            <div className="space-y-4">
              {idleNodes.map((nodeId, idx) => (
                <div key={idx} className="p-4 bg-surface-hover border border-border rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 uppercase">
                    <span>Active Deployment</span>
                    <span className="text-primary font-bold">100% Resource Reallocated</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">{nodeId.replace('Node-', 'Server ')}</h4>
                  <div className="flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider justify-between">
                    <span>Local Model: Llama-3.1</span>
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping"></span>
                  </div>
                </div>
              ))}
              
              {idleNodes.length === 0 && (
                <div className="p-12 text-center text-zinc-550 font-mono text-xs uppercase flex flex-col items-center justify-center gap-2">
                  <CheckCircle className="w-8 h-8 text-primary mb-1" />
                  All Servers Active
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
