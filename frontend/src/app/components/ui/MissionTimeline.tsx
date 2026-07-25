'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Activity } from 'lucide-react';
import { pollLearningUpdates } from '../../actions/simulator';

interface TimelineEvent {
  time: string;
  label: string;
  detail?: string;
  type: 'success' | 'warning' | 'critical' | 'info' | 'migration';
}

interface MissionTimelineProps {
  // Optional injected events from Judge Mode
  injectedEvents?: TimelineEvent[];
}

function typeToColor(type: TimelineEvent['type']) {
  switch (type) {
    case 'critical':  return 'text-red-400 border-red-500/40 bg-red-500/5';
    case 'warning':   return 'text-amber-400 border-amber-500/40 bg-amber-500/5';
    case 'success':   return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/5';
    case 'migration': return 'text-blue-400 border-blue-500/40 bg-blue-500/5';
    default:          return 'text-zinc-300 border-zinc-700/40 bg-zinc-900/30';
  }
}

function dotColor(type: TimelineEvent['type']) {
  switch (type) {
    case 'critical':  return 'bg-red-500';
    case 'warning':   return 'bg-amber-400';
    case 'success':   return 'bg-emerald-500';
    case 'migration': return 'bg-blue-400';
    default:          return 'bg-zinc-500';
  }
}

function actionToType(action: string): TimelineEvent['type'] {
  if (action.includes('MIGRATION')) return 'migration';
  if (action.includes('CRITICAL') || action.includes('KILL') || action.includes('TERMINATE')) return 'critical';
  if (action.includes('SUSPEND') || action.includes('SHEDDING')) return 'warning';
  if (action.includes('CONSOLIDATION')) return 'success';
  return 'info';
}

export function MissionTimeline({ injectedEvents = [] }: MissionTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchUpdates = async () => {
    try {
      const data = await pollLearningUpdates();
      if (!Array.isArray(data)) return;
      const mapped: TimelineEvent[] = data.slice(0, 30).map((u: any) => ({
        time: new Date(u.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
        label: u.action,
        detail: u.reason?.slice(0, 80),
        type: actionToType(u.action),
      }));
      setEvents(mapped);
    } catch {
      // silent — keep existing events
    }
  };

  useEffect(() => {
    fetchUpdates();
    const id = setInterval(fetchUpdates, 2000);
    return () => clearInterval(id);
  }, []);

  // Merge injected events (from Judge Mode) at the top
  const allEvents = [...injectedEvents, ...events].slice(0, 40);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [allEvents.length]);

  return (
    <div className="card p-5 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-border flex-shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-primary" />
            Mission Timeline
          </h2>
          <p className="text-mono-label text-zinc-500 mt-0.5">Live AI operations log</p>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 border border-primary/20 rounded-full">
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
          <span className="text-[9px] font-mono font-bold text-primary uppercase">Live</span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0">
        {allEvents.length === 0 && (
          <p className="text-center font-mono text-xs text-zinc-600 py-8">Awaiting AI decisions...</p>
        )}
        {allEvents.map((ev, i) => (
          <div
            key={i}
            className={`flex gap-2.5 p-2 rounded-lg border text-xs font-mono transition-all duration-300 ${typeToColor(ev.type)}`}
          >
            <div className="flex flex-col items-center gap-0.5 flex-shrink-0 pt-0.5">
              <div className={`w-2 h-2 rounded-full ${dotColor(ev.type)}`} />
              {i < allEvents.length - 1 && <div className="w-px flex-1 bg-zinc-700/50 my-0.5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 text-[10px] flex-shrink-0">{ev.time}</span>
                <span className="font-bold truncate">{ev.label}</span>
              </div>
              {ev.detail && (
                <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{ev.detail}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
