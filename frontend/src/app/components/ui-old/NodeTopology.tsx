'use client';

import React, { useState, useEffect } from 'react';

const NodeCell = React.memo(({ id, status }: { id: number, status: string }) => (
  <div 
    className={`w-3 h-3 border border-border ${
      status === 'nominal' ? 'bg-background' : 
      status === 'warning' ? 'bg-secondary' : 'bg-primary animate-pulse'
    }`}
    title={`Node-${id}`}
  />
));

export function NodeTopology() {
  // Generate 128 nodes (16x8 grid)
  const [nodes, setNodes] = useState(Array.from({ length: 128 }, (_, i) => ({
    id: i,
    status: 'nominal' // nominal, warning, critical
  })));

  useEffect(() => {
    // Simulate real-time GPU state changes
    const interval = setInterval(() => {
      setNodes(prev => prev.map(node => {
        // 90% chance to stay nominal, 8% warning, 2% critical
        const rand = Math.random();
        let status = 'nominal';
        if (rand > 0.98) status = 'critical';
        else if (rand > 0.90) status = 'warning';
        return { ...node, status };
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card p-4">
      <div className="flex justify-between items-center mb-4 border-b border-border pb-2">
        <h2 className="font-mono text-sm font-bold uppercase">Active GPU Topology</h2>
        <span className="font-mono text-xs px-2 py-1 bg-text-primary text-background">128 NODES</span>
      </div>
      <div className="grid grid-cols-16 gap-1">
        {nodes.map(node => (
          <NodeCell key={node.id} id={node.id} status={node.status} />
        ))}
      </div>
      <div className="flex gap-4 mt-4 font-mono text-[10px] uppercase">
        <div className="flex items-center gap-1"><div className="w-2 h-2 border border-border bg-background"></div> IDLE</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 border border-border bg-secondary"></div> LOAD</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 border border-border bg-primary"></div> CRIT</div>
      </div>
    </div>
  );
}
