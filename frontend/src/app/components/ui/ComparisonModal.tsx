import React from 'react';
import { X, Server, BrainCircuit, Check, XCircle } from 'lucide-react';

interface ComparisonModalProps {
  onClose: () => void;
}

export default function ComparisonModal({ onClose }: ComparisonModalProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-ws-bg border border-border shadow-2xl rounded-2xl w-full max-w-5xl overflow-hidden flex flex-col relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-ws-surface rounded-full text-nord4 hover:text-white hover:bg-nord11 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-6 border-b border-border text-center bg-ws-surface">
          <h2 className="text-2xl font-black text-white uppercase tracking-wider">Traditional Scheduler vs CustroConnect AI</h2>
          <p className="text-sm text-nord4/70 mt-2 font-mono">Performance, Efficiency, and Cost Analysis</p>
        </div>

        <div className="flex flex-col md:flex-row h-full">
          {/* Traditional Side */}
          <div className="flex-1 p-8 bg-zinc-950 border-r border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-zinc-800 rounded-lg">
                <Server className="w-8 h-8 text-zinc-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-300">Legacy Kubernetes</h3>
                <p className="text-xs text-zinc-500 font-mono">Rule-based, static thresholds</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center py-3 border-b border-zinc-800">
                <span className="text-zinc-400">GPU Utilization</span>
                <span className="text-red-400 font-bold font-mono">71% (Idle Waste)</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-zinc-800">
                <span className="text-zinc-400">Failure Recovery</span>
                <span className="text-red-400 font-bold font-mono">Reactive (15m Downtime)</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-zinc-800">
                <span className="text-zinc-400">Power Consumption</span>
                <span className="text-yellow-500 font-bold font-mono">75,000 W</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-zinc-800">
                <span className="text-zinc-400">Daily Cloud Cost</span>
                <span className="text-red-400 font-bold font-mono">£7,200</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-zinc-800">
                <span className="text-zinc-400">Scheduling Logic</span>
                <span className="text-zinc-500 font-bold font-mono">Round-Robin / Bin Packing</span>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-red-950/20 border border-red-900/30 rounded-lg flex gap-3">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-zinc-400">Traditional schedulers treat all GPUs equally, leading to thermal bottlenecks, idle waste, and catastrophic job failures during hardware degradation.</p>
            </div>
          </div>

          {/* CustroConnect Side */}
          <div className="flex-1 p-8 bg-ws-bg relative overflow-hidden">
            {/* Glowing background effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/20 rounded-lg border border-primary/30">
                <BrainCircuit className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">CustroConnect AI</h3>
                <p className="text-xs text-primary font-mono font-bold">Predictive, ML-driven Orchestration</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center py-3 border-b border-border/50">
                <span className="text-nord4">GPU Utilization</span>
                <span className="text-green-400 font-bold font-mono">89% (Optimal)</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border/50">
                <span className="text-nord4">Failure Recovery</span>
                <span className="text-primary font-bold font-mono">Predictive (Zero Downtime)</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border/50">
                <span className="text-nord4">Power Consumption</span>
                <span className="text-green-400 font-bold font-mono">62,000 W (Thermal Aware)</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border/50">
                <span className="text-nord4">Daily Cloud Cost</span>
                <span className="text-green-400 font-bold font-mono">£5,900 (-18% Savings)</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border/50">
                <span className="text-nord4">Scheduling Logic</span>
                <span className="text-primary font-bold font-mono">Isolation Forest ML + Ray</span>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-primary/10 border border-primary/30 rounded-lg flex gap-3">
              <Check className="w-5 h-5 text-primary flex-shrink-0" />
              <p className="text-sm text-nord4">CustroConnect uses machine learning to predict thermal anomalies before they happen, autonomously live-migrating workloads to optimal nodes, saving costs and preventing downtime.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
