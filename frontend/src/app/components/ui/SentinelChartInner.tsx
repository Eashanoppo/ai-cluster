import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function SentinelChartInner({ chartData }: { chartData: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
            <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis 
          dataKey="time" 
          stroke="#94A3B8" 
          fontSize={10} 
          fontFamily="JetBrains Mono" 
          tickLine={false} 
          axisLine={false} 
          tickFormatter={(tick) => {
            const index = parseInt(tick.replace("t-", ""), 10);
            if (isNaN(index)) return tick;
            // Only show every 5th tick + the last tick to prevent overlapping
            if (index % 5 === 0 || index === 19) {
              const dataPoint = chartData[index];
              return dataPoint ? dataPoint.timestampLabel : "";
            }
            return "";
          }}
        />
        <YAxis stroke="#94A3B8" fontSize={10} fontFamily="JetBrains Mono" tickLine={false} axisLine={false} domain={[0, 100]} />
        <Tooltip 
          labelFormatter={(tick) => {
            const index = parseInt(tick.replace("t-", ""), 10);
            const dataPoint = chartData[index];
            return dataPoint ? `Time: ${dataPoint.timestampLabel}` : tick;
          }}
          contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', color: '#0F172A', fontFamily: 'JetBrains Mono', fontSize: '11px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }} 
        />
        <Area 
          type="monotone" 
          dataKey="probability" 
          stroke="#2563EB" 
          strokeWidth={2} 
          fillOpacity={1} 
          fill="url(#colorTemp)" 
          isAnimationActive={true}
          animationDuration={1500}
          animationEasing="ease-in-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
