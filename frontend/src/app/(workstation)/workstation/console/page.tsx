"use client";

import React, { useState, useEffect } from "react";
import { getSimulationRuns, setSimulatorScenario, getSimulatorScenario } from "../../../services/api";
import { Play, Square, Activity, FastForward, Clock, Database, Layers, ArrowRight } from "lucide-react";

export default function SimulatorConsolePage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [pattern, setPattern] = useState<string>("startup");
  const [duration, setDuration] = useState<number>(2);
  const [acceleration, setAcceleration] = useState<number>(1);
  
  const [status, setStatus] = useState<string>("stopped");
  const [runs, setRuns] = useState<any[]>([]);
  
  useEffect(() => {
    // Fetch companies
    import("../../../services/api").then(api => {
      api.fetchWithAuth('/simulator/companies/').then((data: any) => {
        if (data && data.length > 0) {
          setCompanies(data);
          setSelectedCompany(data[0].id.toString());
        }
      });
    });
    
    // Poll state
    const interval = setInterval(() => {
      getSimulatorScenario().then((data: any) => {
        if (data) {
          setStatus(data.status);
        }
      }).catch(() => {});
      
      getSimulationRuns().then((data: any) => {
        if (data) setRuns(data.slice(0, 50)); // Last 50 runs
      }).catch(() => {});
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const handleStart = async () => {
    const company = companies.find(c => c.id.toString() === selectedCompany);
    await setSimulatorScenario({
      action: "start",
      scenario_id: pattern,
      duration_mins: duration,
      acceleration: acceleration,
      allowed_tasks: company ? company.allowed_tasks : []
    });
    setStatus("running");
  };

  const handleStop = async () => {
    await setSimulatorScenario({ action: "stop" });
    setStatus("stopped");
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-nord0 flex items-center gap-2">
            <Activity className="text-primary" /> Simulator Console
          </h1>
          <p className="text-nord3 text-sm mt-1">Configure and inject traffic scenarios into the AI Cluster</p>
        </div>
        <div className="flex gap-4">
          <a href="/workstation" className="px-4 py-2 bg-ws-surface border border-nord4 rounded-lg text-sm text-nord2 hover:text-nord0 transition-colors">
            AI Chat Simulator
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Control Panel */}
        <div className="col-span-1 bg-ws-surface border border-nord4 rounded-lg p-6 space-y-6">
          <h2 className="text-lg font-bold text-nord0 mb-4">Traffic Injection Parameters</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-nord3 uppercase mb-1">Company Profile</label>
              <select 
                className="w-full bg-white border border-nord4 text-nord0 text-sm rounded p-2"
                value={selectedCompany}
                onChange={e => setSelectedCompany(e.target.value)}
              >
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.industry})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-nord3 uppercase mb-1">Traffic Scenario</label>
              <select 
                className="w-full bg-white border border-nord4 text-nord0 text-sm rounded p-2"
                value={pattern}
                onChange={e => setPattern(e.target.value)}
              >
                <option value="startup">Startup (Low/Normal Traffic)</option>
                <option value="enterprise">Enterprise (Peak Hours Spike)</option>
                <option value="black_friday">Viral Event (Massive DDOS)</option>
                <option value="gpu_failure_storm">GPU Failure Storm</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-nord3 uppercase mb-1">Duration (Mins)</label>
                <div className="relative">
                  <Clock className="absolute left-2 top-2 w-4 h-4 text-nord3" />
                  <input 
                    type="number" min="1" max="60"
                    className="w-full bg-white border border-nord4 text-nord0 text-sm rounded p-2 pl-8"
                    value={duration}
                    onChange={e => setDuration(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono text-nord3 uppercase mb-1">Time Accel</label>
                <div className="relative">
                  <FastForward className="absolute left-2 top-2 w-4 h-4 text-nord3" />
                  <select 
                    className="w-full bg-white border border-nord4 text-nord0 text-sm rounded p-2 pl-8"
                    value={acceleration}
                    onChange={e => setAcceleration(parseInt(e.target.value))}
                  >
                    <option value="1">1x Realtime</option>
                    <option value="2">2x Fast</option>
                    <option value="5">5x Very Fast</option>
                    <option value="10">10x Extreme</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-nord4 flex gap-3">
            {status !== "running" ? (
              <button 
                onClick={handleStart}
                className="flex-1 bg-nord14 hover:bg-nord14/80 text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                <Play className="w-5 h-5" /> Start Simulation
              </button>
            ) : (
              <button 
                onClick={handleStop}
                className="flex-1 bg-nord11 hover:bg-nord11/80 text-nord0 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all animate-pulse"
              >
                <Square className="w-5 h-5 fill-white" /> Stop Injection
              </button>
            )}
          </div>
        </div>

        {/* Live Workload Lifecycle */}
        <div className="col-span-2 bg-ws-surface border border-nord4 rounded-lg p-6 flex flex-col h-[600px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-nord0 flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" /> Active Workload Lifecycle
            </h2>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className={`w-2 h-2 rounded-full ${status === 'running' ? 'bg-nord14 animate-pulse' : 'bg-nord3'}`}></span>
              <span className={status === 'running' ? 'text-nord14' : 'text-nord3'}>
                {status.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
            {runs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-nord3">
                <Layers className="w-12 h-12 mb-2 opacity-20" />
                <p>No active workloads in the cluster.</p>
                <p className="text-xs mt-1">Start a simulation to inject traffic.</p>
              </div>
            ) : (
              runs.map(run => (
                <div key={run.id} className="bg-white border border-nord4 rounded p-3 flex items-center justify-between animate-fade-up">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-8 rounded bg-primary"></div>
                    <div>
                      <div className="text-sm font-bold text-nord0">{run.task_type.replace(/_/g, ' ').toUpperCase()}</div>
                      <div className="text-[10px] font-mono text-nord3">JOB-{run.id} • Priority: {run.priority}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] text-nord3 uppercase tracking-wider mb-1">State</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        run.status === 'completed' ? 'bg-nord14/20 text-nord14' :
                        run.status === 'failed' ? 'bg-nord11/20 text-nord11' :
                        'bg-nord13/20 text-nord13 animate-pulse'
                      }`}>
                        {run.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <ArrowRight className="w-4 h-4 text-nord2" />
                    
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] text-nord3 uppercase tracking-wider mb-1">Resources</span>
                      <span className="text-xs font-mono text-nord2">{run.allocated_nodes || run.required_nodes || 0} Nodes</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
