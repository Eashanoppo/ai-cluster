'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Check, X, Info } from 'lucide-react';
import { approveRequest, rejectRequest, pollPendingApprovals } from '../../actions/gate';

export interface ApprovalRequest {
  id: number;
  action_type: string;
  reason: string;
  status: string;
  target_resource: string;
}

export function ApprovalGate({ requests }: { requests: ApprovalRequest[] }) {
  const [requestsList, setRequestsList] = useState<ApprovalRequest[]>(requests);
  const [loading, setLoading] = useState<number | null>(null);

  // Poll for new pending approvals in the background
  useEffect(() => {
    const interval = setInterval(async () => {
      const freshData = await pollPendingApprovals();
      if (freshData) {
        setRequestsList(freshData);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const pendingRequests = requestsList.filter(r => r.status === 'PENDING');

  if (pendingRequests.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col min-h-[160px] justify-center items-center text-center font-sans">
        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-3">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">Execution Gate Nominal</h3>
        <p className="text-xs text-gray-400 mt-1 max-w-[200px]">All autonomous scheduling operations are clear.</p>
      </div>
    );
  }

  const handleApprove = async (id: number) => {
    setLoading(id);
    // Optimistic UI: remove immediately on client
    setRequestsList(prev => prev.filter(r => r.id !== id));
    await approveRequest(id);
    setLoading(null);
  };

  const handleReject = async (id: number) => {
    setLoading(id);
    // Optimistic UI: remove immediately on client
    setRequestsList(prev => prev.filter(r => r.id !== id));
    await rejectRequest(id);
    setLoading(null);
  };

  return (
    <div className="bg-white border border-red-200 rounded-2xl p-5 shadow-sm relative font-sans">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500 animate-pulse"></div>
      
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            Execution Gate
          </h2>
          <p className="text-[10px] text-red-500 font-mono uppercase tracking-wider mt-0.5">Operator Intervention Required</p>
        </div>
        <span className="font-mono text-[9px] font-bold px-2 py-0.5 bg-red-50 text-red-500 rounded-full border border-red-100 animate-bounce">
          {pendingRequests.length} BLOCKED
        </span>
      </div>

      <div className="space-y-4">
        {pendingRequests.map((req) => (
          <div key={req.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800 uppercase tracking-wide">
                <Info className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                {req.action_type}
              </div>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{req.reason}</p>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => handleApprove(req.id)}
                disabled={loading === req.id}
                className="flex-1 bg-blue-600 text-white rounded-lg font-medium text-xs py-2 px-3 flex items-center justify-center gap-1.5 hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading === req.id ? (
                  <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )} 
                APPROVE
              </button>
              <button 
                onClick={() => handleReject(req.id)}
                disabled={loading === req.id}
                className="flex-1 bg-white border border-gray-200 text-gray-600 rounded-lg font-medium text-xs py-2 px-3 flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {loading === req.id ? (
                  <span className="animate-spin w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full" />
                ) : (
                  <X className="w-3.5 h-3.5" />
                )} 
                REJECT
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
