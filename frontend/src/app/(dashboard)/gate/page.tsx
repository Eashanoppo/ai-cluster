import React from 'react';
import { Lock, History, ShieldCheck, Check, X, User } from 'lucide-react';
import { ApprovalGate } from '../../components/ui/ApprovalGate';
import { getPendingApprovals, getApprovalsHistory } from '../../services/api';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function GatePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('jwt')?.value;

  if (!token) {
    redirect('/login');
  }

  // Fetch pending approvals and past approvals history concurrently
  const [pending, history] = await Promise.all([
    getPendingApprovals().catch(() => []),
    getApprovalsHistory().catch(() => [])
  ]);

  const safePending = Array.isArray(pending) ? pending : ((pending as any).results || []);
  const safeHistory = Array.isArray(history) ? history : ((history as any).results || []);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Page Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 font-serif leading-none tracking-tight">Execution Gate Manager</h2>
          <p className="text-xs text-gray-500 mt-1.5">Human-in-the-loop audit logs and authorization controls</p>
        </div>
        <div className="flex gap-3">
          <span className="font-mono text-xs font-bold px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            {safePending.length} Actions Blocked
          </span>
        </div>
      </div>

      {/* Split Layout: Pending queue on left, history on right or full width grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (1/3 width) - Pending Queue */}
        <div className="lg:col-span-1 space-y-6">
          <ApprovalGate requests={safePending} />
        </div>

        {/* Right Column (2/3 width) - Historical Audit Log */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-blue-600" />
                  Operator Decision Audit Log
                </h3>
                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mt-0.5">Logs of approved and rejected autonomous scheduling actions</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-mono uppercase tracking-wider text-[9px] pb-2">
                    <th className="py-2.5">Decision Time</th>
                    <th className="py-2.5">Resource</th>
                    <th className="py-2.5">Action Type</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5">Approved By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono text-gray-600">
                  {safeHistory.map((req: any) => (
                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 text-[10px] text-gray-400">
                        {req.approved_at ? new Date(req.approved_at).toLocaleString() : '—'}
                      </td>
                      <td className="py-3 font-bold text-gray-800">{req.target_resource}</td>
                      <td className="py-3 text-[11px] text-gray-500 truncate max-w-[120px]" title={req.action_type}>
                        {req.action_type}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${
                          req.status === 'APPROVED' 
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                            : 'bg-red-50 border-red-100 text-red-500'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500 font-sans text-[11px] flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        {req.approved_by?.username || 'System Agent'}
                      </td>
                    </tr>
                  ))}
                  {safeHistory.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-gray-400 font-mono text-xs uppercase">
                        No historical decisions archived.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
