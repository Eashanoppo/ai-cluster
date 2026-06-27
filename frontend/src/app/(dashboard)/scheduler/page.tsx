import React from 'react';
import { ArrowRightLeft, CheckCircle, Activity } from 'lucide-react';
import { getPlacements } from '../../services/api';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function SchedulerPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('jwt')?.value;

  if (!token) {
    redirect('/login');
  }

  // Fetch placements
  const placements = await getPlacements().catch(() => []);
  const safePlacements = Array.isArray(placements) ? placements : ((placements as any).results || []);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Page Header */}
      <div className="card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white leading-none tracking-tight">Workload Placement Scheduler</h2>
          <p className="text-xs text-zinc-400 mt-1.5">Autonomous job migration & thermal workload routing</p>
        </div>
        <div className="flex gap-3">
          <span className="font-mono text-xs font-bold px-3 py-1.5 bg-primary/10 text-primary rounded-xl border border-primary/20 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            {safePlacements.length} Total Migrations Logged
          </span>
        </div>
      </div>

      {/* Placements Audit Log Table */}
      <div className="card p-5">
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-border">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <ArrowRightLeft className="w-4 h-4 text-primary" />
              Scheduler Placement History
            </h3>
            <p className="text-[10px] text-zinc-450 font-mono uppercase tracking-wider mt-0.5">Audit log of all autonomous workload routing actions</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-zinc-400 font-mono uppercase tracking-wider text-[9px] pb-2">
                <th className="py-2.5">Migrated At</th>
                <th className="py-2.5">Job ID</th>
                <th className="py-2.5">Source (Hot Node)</th>
                <th className="py-2.5">Destination (Target Node)</th>
                <th className="py-2.5">Routing Status</th>
                <th className="py-2.5">Trigger Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono text-zinc-300">
              {safePlacements.map((placement: any) => (
                <tr key={placement.id} className="hover:bg-surface-hover transition-colors">
                  <td className="py-3 text-[10px] text-zinc-500">
                    {new Date(placement.migrated_at).toLocaleString()}
                  </td>
                  <td className="py-3 font-bold text-white">{placement.job_id}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-[10px] font-bold">
                      {placement.source_node}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      placement.target_node.includes('None')
                        ? 'bg-zinc-800 border border-zinc-700 text-zinc-400'
                        : 'bg-primary/10 border border-primary/20 text-primary'
                    }`}>
                      {placement.target_node}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary rounded-full text-[9px] font-bold flex items-center gap-1 w-fit">
                      <CheckCircle className="w-3 h-3" />
                      {placement.status || 'COMPLETED'}
                    </span>
                  </td>
                  <td className="py-3 text-[11px] font-sans text-zinc-400 max-w-[260px] truncate" title={placement.reason}>
                    {placement.reason}
                  </td>
                </tr>
              ))}
              {safePlacements.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-zinc-550 font-mono text-xs uppercase">
                    No placement or workload migration events.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
