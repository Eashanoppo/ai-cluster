import React from 'react';
import { ArrowRightLeft, Cpu, ShieldAlert, CheckCircle, Activity } from 'lucide-react';
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
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 font-serif leading-none tracking-tight">Workload Placement Scheduler</h2>
          <p className="text-xs text-gray-500 mt-1.5">Autonomous job migration & thermal workload routing</p>
        </div>
        <div className="flex gap-3">
          <span className="font-mono text-xs font-bold px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            {safePlacements.length} Total Migrations Logged
          </span>
        </div>
      </div>

      {/* Placements Audit Log Table */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
              <ArrowRightLeft className="w-4 h-4 text-blue-600" />
              Scheduler Placement History
            </h3>
            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mt-0.5">Audit log of all autonomous workload routing actions</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-mono uppercase tracking-wider text-[9px] pb-2">
                <th className="py-2.5">Migrated At</th>
                <th className="py-2.5">Job ID</th>
                <th className="py-2.5">Source (Hot Node)</th>
                <th className="py-2.5">Destination (Target Node)</th>
                <th className="py-2.5">Routing Status</th>
                <th className="py-2.5">Trigger Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono text-gray-600">
              {safePlacements.map((placement: any) => (
                <tr key={placement.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 text-[10px] text-gray-400">
                    {new Date(placement.migrated_at).toLocaleString()}
                  </td>
                  <td className="py-3 font-bold text-gray-800">{placement.job_id}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 bg-red-50 border border-red-100 text-red-500 rounded text-[10px] font-bold">
                      {placement.source_node}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      placement.target_node.includes('None')
                        ? 'bg-gray-100 border border-gray-200 text-gray-500'
                        : 'bg-emerald-50 border border-emerald-100 text-emerald-600'
                    }`}>
                      {placement.target_node}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-full text-[9px] font-bold flex items-center gap-1 w-fit">
                      <CheckCircle className="w-3 h-3" />
                      {placement.status || 'COMPLETED'}
                    </span>
                  </td>
                  <td className="py-3 text-[11px] font-serif text-gray-500 max-w-[260px] truncate" title={placement.reason}>
                    {placement.reason}
                  </td>
                </tr>
              ))}
              {safePlacements.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400 font-mono text-xs uppercase">
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
