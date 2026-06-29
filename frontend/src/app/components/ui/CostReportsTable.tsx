'use client';

import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface CostReport {
  id: number;
  reported_at: string;
  node_id: string;
  idle_time_hours: number;
  wasted_cost_usd: string;
}

export function CostReportsTable({ reports }: { reports: CostReport[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(reports.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedReports = reports.slice(startIndex, startIndex + itemsPerPage);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border text-zinc-400 font-mono uppercase tracking-wider text-[9px] pb-2">
              <th className="py-2.5">Reported At</th>
              <th className="py-2.5">Server</th>
              <th className="py-2.5">Inactive Duration (Hours)</th>
              <th className="py-2.5">Underutilized Value (USD)</th>
              <th className="py-2.5">Optimization State</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-mono text-zinc-300">
            {paginatedReports.map((c) => (
              <tr key={c.id} className="hover:bg-surface-hover transition-colors">
                <td className="py-3 text-[10px] text-zinc-550">
                  {new Date(c.reported_at).toLocaleString()}
                </td>
                <td className="py-3 font-bold text-white">{c.node_id.replace('Node-', 'Server ')}</td>
                <td className="py-3">{c.idle_time_hours.toFixed(1)} H</td>
                <td className="py-3 text-red-400 font-bold">${parseFloat(c.wasted_cost_usd).toFixed(2)}</td>
                <td className="py-3">
                  <span className="px-2.5 py-0.5 bg-primary/10 border border-primary/20 text-primary rounded-full text-[9px] font-bold flex items-center gap-1 w-fit">
                    <Sparkles className="w-3 h-3" />
                    Local Model Tasks
                  </span>
                </td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td colSpan={5} className="py-16 text-center text-zinc-500 font-mono text-xs uppercase">
                  All capacity fully utilized (150% target efficiency).
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {reports.length > 0 && (
        <div className="flex items-center justify-between border-t border-border pt-4 font-sans">
          <span className="text-[11px] text-zinc-400 font-medium">
            Showing <span className="font-semibold text-white">{startIndex + 1}</span> to{' '}
            <span className="font-semibold text-white">
              {Math.min(startIndex + itemsPerPage, reports.length)}
            </span>{' '}
            of <span className="font-semibold text-white">{reports.length}</span> reports
          </span>
          <div className="flex gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-border bg-surface rounded-xl text-xs font-semibold text-zinc-450 hover:bg-zinc-800 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
            >
              Previous
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-border bg-surface rounded-xl text-xs font-semibold text-zinc-450 hover:bg-zinc-800 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
