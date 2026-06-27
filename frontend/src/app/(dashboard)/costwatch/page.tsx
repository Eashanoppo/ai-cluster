import React from 'react';
import { DollarSign, Trash2, Cpu, Sparkles, History, CheckCircle } from 'lucide-react';
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
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 font-serif leading-none tracking-tight">CostWatch GPU Allocator</h2>
          <p className="text-xs text-gray-500 mt-1.5">Monitors idle nodes and redirects idle GPU power to local LLMs</p>
        </div>
        <div className="flex gap-3">
          <span className="font-mono text-xs font-bold px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4" />
            ${totalSaved.toFixed(2)} Total Savings Reclaimed
          </span>
        </div>
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2/3 width) - Cost Reports History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-blue-600" />
                  Wasted Capacity Reports
                </h3>
                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mt-0.5">Logs of idle nodes flagged for LLM redirection</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <CostReportsTable reports={safeCosts} />
            </div>
          </div>
        </div>

        {/* Right Column (1/3 width) - Ollama Fleet Provisioning status */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-blue-600" />
              Ollama Redirection Fleet
            </h3>
            
            <div className="space-y-4">
              {idleNodes.map((nodeId, idx) => (
                <div key={idx} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 uppercase">
                    <span>Active Deployment</span>
                    <span className="text-blue-600 font-bold">100% GPU Reclaimed</span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm font-serif">{nodeId}</h4>
                  <div className="flex items-center gap-2 bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider justify-between">
                    <span>Local LLM: Llama-3.1-8B</span>
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></span>
                  </div>
                </div>
              ))}
              
              {idleNodes.length === 0 && (
                <div className="p-12 text-center text-gray-400 font-mono text-xs uppercase flex flex-col items-center justify-center gap-2">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mb-1" />
                  0 Idle GPUs
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
