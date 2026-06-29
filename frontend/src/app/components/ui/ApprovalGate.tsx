'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Check, X, Info } from 'lucide-react';
import { approveRequest, rejectRequest, pollPendingApprovals } from '../../actions/gate';
import { useRouter } from 'next/navigation';

export interface ApprovalRequest {
  id: number;
  action_type: string;
  reason: string;
  status: string;
  target_resource: string;
}

export function ApprovalGate({ requests }: { requests: ApprovalRequest[] }) {
  const router = useRouter();
  const [requestsList, setRequestsList] = useState<ApprovalRequest[]>(requests);
  const [processedIds, setProcessedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState<number | null>(null);

  const pendingRequests = requestsList.filter(r => r.status === 'PENDING' && !processedIds.includes(r.id));

  // Sync ref to current count so polling interval knows what was rendered
  const lastCountRef = useRef(pendingRequests.length);
  useEffect(() => {
    lastCountRef.current = pendingRequests.length;
  }, [pendingRequests.length]);

  // Poll for new pending approvals in the background
  useEffect(() => {
    const interval = setInterval(async () => {
      const freshData = await pollPendingApprovals();
      if (freshData) {
        const newCount = freshData.filter((r: ApprovalRequest) => r.status === 'PENDING').length;
        setRequestsList(freshData);
        // Clear processed IDs that are no longer returned in the polled pending set
        setProcessedIds(prev => prev.filter(id => freshData.some(r => r.id === id)));
        
        // Refresh server components if count has changed
        if (newCount !== lastCountRef.current) {
          router.refresh();
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [router]);

  if (pendingRequests.length === 0) {
    return (
      <div className="card p-5 flex flex-col min-h-[160px] justify-center items-center text-center font-sans">
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-semibold text-white">Approvals Clear</h3>
        <p className="text-xs text-zinc-400 mt-1 max-w-[200px]">All automated system operations are running normally.</p>
      </div>
    );
  }

  const handleApprove = async (id: number) => {
    setLoading(id);
    // Optimistic UI: track as processed and filter out immediately
    setProcessedIds(prev => [...prev, id]);
    await approveRequest(id);
    router.refresh();
    setLoading(null);
  };

  const handleReject = async (id: number) => {
    setLoading(id);
    // Optimistic UI: track as processed and filter out immediately
    setProcessedIds(prev => [...prev, id]);
    await rejectRequest(id);
    router.refresh();
    setLoading(null);
  };


  return (
    <div className="card border-red-500/35 shadow-[0_0_20px_rgba(239,68,68,0.12)] p-5 relative font-sans animate-fade-up delay-300">
      
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-border">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-1.5">
            Required Action Approvals
          </h2>
          <p className="text-mono-label text-red-400 mt-0.5">Review Needed</p>
        </div>
        <span className="font-mono text-[9px] font-bold px-2 py-0.5 bg-red-500/10 text-red-400 rounded-full border border-red-500/20 animate-bounce">
          {pendingRequests.length} PENDING
        </span>
      </div>

      <div className="space-y-4">
        {pendingRequests.map((req) => (
          <div key={req.id} className="p-4 bg-surface-hover border border-border rounded-xl space-y-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white uppercase tracking-wide">
                <Info className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                {req.action_type === 'MIGRATE' ? 'Move Task' : req.action_type === 'KILL' ? 'Stop Process' : req.action_type}
              </div>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">{req.reason.replace('GPU-fleet', 'Server Grid').replace('DCGM telemetry alert', 'temperature threshold alert')}</p>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => handleApprove(req.id)}
                disabled={loading === req.id}
                className="flex-1 bg-primary text-black rounded-lg font-semibold text-xs py-2 px-3 flex items-center justify-center gap-1.5 hover:bg-primary-hover transition-all duration-200 disabled:opacity-50 cursor-pointer outline-none glow-focus"
              >
                {loading === req.id ? (
                  <span className="animate-spin w-3 h-3 border-2 border-black border-t-transparent rounded-full" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )} 
                Approve
              </button>
              <button 
                onClick={() => handleReject(req.id)}
                disabled={loading === req.id}
                className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-350 rounded-lg font-medium text-xs py-2 px-3 flex items-center justify-center gap-1.5 hover:bg-zinc-750 hover:text-white transition-all duration-200 disabled:opacity-50 cursor-pointer outline-none glow-focus"
              >
                {loading === req.id ? (
                  <span className="animate-spin w-3 h-3 border-2 border-zinc-400 border-t-transparent rounded-full" />
                ) : (
                  <X className="w-3.5 h-3.5" />
                )} 
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
