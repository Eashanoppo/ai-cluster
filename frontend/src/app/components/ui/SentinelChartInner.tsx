import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function SentinelChartInner({ chartData }: { chartData: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#FF9A9E" stopOpacity={0.5}/>
            <stop offset="95%" stopColor="#FF9A9E" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#9CA3AF" vertical={false} />
        <XAxis dataKey="time" stroke="#4B5563" fontSize={10} fontFamily="JetBrains Mono" tickLine={false} axisLine={false} />
        <YAxis stroke="#4B5563" fontSize={10} fontFamily="JetBrains Mono" tickLine={false} axisLine={false} domain={[0, 100]} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#E5E2D8', borderColor: '#9CA3AF', color: '#111827', fontFamily: 'JetBrains Mono', fontSize: '12px' }} 
        />
        <Area type="monotone" dataKey="probability" stroke="#FF9A9E" strokeWidth={2} fillOpacity={1} fill="url(#colorTemp)" isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
