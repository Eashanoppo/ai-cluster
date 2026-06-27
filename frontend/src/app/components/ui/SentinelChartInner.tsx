import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function SentinelChartInner({ chartData }: { chartData: any[] }) {
  const latestPoint = chartData[chartData.length - 1];
  const latestProb = latestPoint ? latestPoint.probability : 0;

  // Dynamic threshold-based color: <50 green, 50-80 amber, >=80 red
  let themeColor = "#6ad02f";
  if (latestProb >= 80) {
    themeColor = "#ef4444";
  } else if (latestProb >= 50) {
    themeColor = "#eab308";
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={themeColor} stopOpacity={0.25}/>
            <stop offset="95%" stopColor={themeColor} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
        <XAxis 
          dataKey="time" 
          stroke="#71717A" 
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
        <YAxis stroke="#71717A" fontSize={10} fontFamily="JetBrains Mono" tickLine={false} axisLine={false} domain={[0, 100]} />
        <Tooltip 
          labelFormatter={(tick) => {
            const index = parseInt(tick.replace("t-", ""), 10);
            const dataPoint = chartData[index];
            return dataPoint ? `Time: ${dataPoint.timestampLabel}` : tick;
          }}
          contentStyle={{ backgroundColor: '#141414', borderRadius: '12px', border: '1px solid #27272A', color: '#FFFFFF', fontFamily: 'JetBrains Mono', fontSize: '11px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)' }} 
        />
        <Area 
          type="monotone" 
          dataKey="probability" 
          stroke={themeColor} 
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
