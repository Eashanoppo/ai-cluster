'use client';

import React, { useState } from 'react';
import { Lock, Check, X } from 'lucide-react';
import { approveRequest, rejectRequest } from '../../actions/gate';
import { ApprovalRequest } from '../../page';

export function ApprovalGate({ requests }: { requests: ApprovalRequest[] }) {
  const [loading, setLoading] = useState<number | null>(null);

  const pendingRequests = requests.filter(r => r.status === 'PENDING');

  if (pendingRequests.length === 0) {
    return (
      <div className="card p-4 border border-secondary relative overflow-hidden flex flex-col h-full min-h-[150px]">
        <div className="absolute top-0 left-0 w-full h-1 bg-secondary opacity-50"></div>
        <h2 className="font-mono text-sm font-bold flex items-center gap-2 mb-4 uppercase text-secondary">
          <Lock className="w-4 h-4" />
          Execution_Gate (Human Required)
        </h2>
        <div className="p-3 bg-surface border border-border flex items-center justify-center flex-1">
          <p className="font-mono text-xs font-bold text-text-secondary uppercase flex items-center gap-2">
            <Check className="w-4 h-4 text-secondary" /> ALL_CLEAR
          </p>
        </div>
      </div>
    );
  }

  const handleApprove = async (id: number) => {
    setLoading(id);
    await approveRequest(id);
    setLoading(null);
  };

  const handleReject = async (id: number) => {
    setLoading(id);
    await rejectRequest(id);
    setLoading(null);
  };

  return (
    <div className="card p-4 border border-secondary relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-secondary animate-pulse"></div>
      <h2 className="font-mono text-sm font-bold flex items-center gap-2 mb-4 uppercase text-secondary">
        <Lock className="w-4 h-4" />
        Execution_Gate (Human Required)
      </h2>
      <div className="space-y-4">
        {pendingRequests.map((req) => (
          <div key={req.id} className="p-3 bg-surface border border-secondary">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-mono text-xs font-bold text-secondary uppercase animate-pulse">ACTION_BLOCKED: {req.action_type}</p>
                <p className="font-mono text-[10px] text-text-primary mt-1">{req.reason}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button 
                onClick={() => handleApprove(req.id)}
                disabled={loading === req.id}
                className="flex-1 bg-secondary text-background font-mono text-xs font-bold py-1 px-2 flex items-center justify-center gap-1 hover:opacity-80 transition-opacity disabled:opacity-50"
              >
                {loading === req.id ? <span className="animate-spin w-3 h-3 border-2 border-background border-t-transparent rounded-full" /> : <Check className="w-3 h-3" />} APPROVE
              </button>
              <button 
                onClick={() => handleReject(req.id)}
                disabled={loading === req.id}
                className="flex-1 border border-secondary text-secondary font-mono text-xs font-bold py-1 px-2 flex items-center justify-center gap-1 hover:bg-surface-hover transition-colors disabled:opacity-50"
              >
                {loading === req.id ? <span className="animate-spin w-3 h-3 border-2 border-secondary border-t-transparent rounded-full" /> : <X className="w-3 h-3" />} REJECT
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
