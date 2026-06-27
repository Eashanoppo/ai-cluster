'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { AlertTriangle } from 'lucide-react';
import { pollPredictions } from '../../actions/sentinel';

const SentinelChartInner = dynamic(
  () => import('./SentinelChartInner'),
  { ssr: false, loading: () => <div className="h-full w-full bg-background border border-border animate-pulse flex items-center justify-center font-mono text-xs text-text-secondary uppercase">Syncing.Telemetry...</div> }
);

export function SentinelChart({ data }: { data: any[] }) {
  const [chartData, setChartData] = useState(() => 
    data.map((d, i) => ({
      time: `T-${10-i}s`,
      probability: Math.min(100, Math.max(0, d.failure_probability * 100))
    }))
  );
  const [latestProb, setLatestProb] = useState(() => {
    if (data.length > 0) return Math.round(data[0].failure_probability * 100);
    return 0;
  });

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const dataArray = await pollPredictions();
        
        if (dataArray && dataArray.length > 0) {
          const mapped = dataArray.slice(0, 10).reverse().map((d: any, i: number) => ({
            time: `T-${10-i}s`,
            probability: Math.min(100, Math.max(0, d.failure_probability * 100))
          }));
          setChartData(mapped);
          // Update the badge with the LATEST prediction
          setLatestProb(Math.round(dataArray[0].failure_probability * 100));
        }
      } catch (err) {
        console.error("Failed to fetch live chart data", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Live Badge */}
      <div className="flex justify-end mb-2 -mt-2">
        {latestProb > 80 ? (
          <div className="px-2 py-1 bg-primary text-text-primary font-mono text-xs font-bold border border-text-primary uppercase flex items-center gap-2 animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            FAIL_PROB: {latestProb}%
          </div>
        ) : (
          <div className="px-2 py-1 bg-surface text-text-secondary font-mono text-xs font-bold border border-border uppercase flex items-center gap-2">
            FAIL_PROB: {latestProb}%
          </div>
        )}
      </div>
      <div className="flex-1">
        <SentinelChartInner chartData={chartData} />
      </div>
    </div>
  );
}
