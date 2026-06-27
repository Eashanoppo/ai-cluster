'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { AlertTriangle } from 'lucide-react';
import { pollPredictions } from '../../actions/sentinel';

const SentinelChartInner = dynamic(
  () => import('./SentinelChartInner'),
  { ssr: false, loading: () => <div className="h-full w-full bg-surface border border-border rounded-2xl animate-pulse flex items-center justify-center font-mono text-xs text-zinc-500 uppercase tracking-wider">Syncing Telemetry...</div> }
);

export function SentinelChart({ data }: { data: any[] }) {
  const [chartData, setChartData] = useState(() => {
    const rawData = data && data.length > 0 ? data : Array.from({ length: 20 }, () => ({ failure_probability: 0.1 }));
    return rawData.slice(0, 20).reverse().map((d, i) => {
      const date = new Date(d.timestamp || (Date.now() - (20 - i) * 5000));
      return {
        time: `t-${i}`,
        timestampLabel: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`,
        probability: Math.min(100, Math.max(0, d.failure_probability * 100))
      };
    });
  });
  const [latestProb, setLatestProb] = useState(() => {
    if (data.length > 0) return Math.round(data[0].failure_probability * 100);
    return 0;
  });

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const dataArray = await pollPredictions();
        
        if (dataArray && dataArray.length > 0) {
          const mapped = dataArray.slice(0, 20).reverse().map((d: any, index: number) => {
            const date = new Date(d.timestamp || Date.now());
            return {
              time: `t-${index}`,
              timestampLabel: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`,
              probability: Math.min(100, Math.max(0, d.failure_probability * 100))
            };
          });
          setChartData(mapped);
          setLatestProb(Math.round(dataArray[0].failure_probability * 100));
        }
      } catch (err) {
        console.error("Failed to fetch live chart data", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col font-sans">
      {/* Live Badge */}
      <div className="flex justify-end mb-3">
        {latestProb > 80 ? (
          <div className="px-2.5 py-1 bg-red-500/15 text-red-400 font-mono text-[10px] font-bold border border-red-500/30 rounded-full uppercase flex items-center gap-1.5 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            FAIL_PROB: {latestProb}%
          </div>
        ) : (
          <div className="px-2.5 py-1 bg-surface-hover text-zinc-400 font-mono text-[10px] font-bold border border-border rounded-full uppercase flex items-center gap-1.5">
            FAIL_PROB: {latestProb}%
          </div>
        )}
      </div>
      <div className="flex-1 min-h-[160px]">
        <SentinelChartInner chartData={chartData} />
      </div>
    </div>
  );
}
