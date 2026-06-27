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
            <tr className="border-b border-gray-100 text-gray-400 font-mono uppercase tracking-wider text-[9px] pb-2">
              <th className="py-2.5">Reported At</th>
              <th className="py-2.5">Node ID</th>
              <th className="py-2.5">Idle Time (Hours)</th>
              <th className="py-2.5">Wasted Value (USD)</th>
              <th className="py-2.5">Redirection Mode</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-mono text-gray-600">
            {paginatedReports.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 text-[10px] text-gray-400">
                  {new Date(c.reported_at).toLocaleString()}
                </td>
                <td className="py-3 font-bold text-gray-800">{c.node_id}</td>
                <td className="py-3">{c.idle_time_hours.toFixed(1)} H</td>
                <td className="py-3 text-red-500 font-bold">${parseFloat(c.wasted_cost_usd).toFixed(2)}</td>
                <td className="py-3">
                  <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-full text-[9px] font-bold flex items-center gap-1 w-fit">
                    <Sparkles className="w-3 h-3" />
                    Ollama Redirection
                  </span>
                </td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td colSpan={5} className="py-16 text-center text-gray-400 font-mono text-xs uppercase">
                  No idle node waste detected (100% Fleet efficiency).
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {reports.length > 0 && (
        <div className="flex items-center justify-between border-t border-gray-150 pt-4 font-sans">
          <span className="text-[11px] text-gray-500 font-medium">
            Showing <span className="font-semibold text-gray-800">{startIndex + 1}</span> to{' '}
            <span className="font-semibold text-gray-800">
              {Math.min(startIndex + itemsPerPage, reports.length)}
            </span>{' '}
            of <span className="font-semibold text-gray-800">{reports.length}</span> reports
          </span>
          <div className="flex gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-all cursor-pointer"
            >
              Previous
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-all cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
