import React, { useState } from 'react';
import { Play, ShieldAlert, Cpu, Users, Building, Zap, Clock } from 'lucide-react';
import { createSimulationRun, injectFailure } from '../../services/api';
import { CompanyProfile } from './CompanyWizard';

interface SimulatorPanelProps {
  onRefreshHistory: () => void;
  activeSessionId: string | null;
  activeCompany?: CompanyProfile | null;
}

export default function SimulatorPanel({ onRefreshHistory, activeSessionId, activeCompany }: SimulatorPanelProps) {
  const [companyName, setCompanyName] = useState(activeCompany?.name || 'OpenAI');
  const [userTraffic, setUserTraffic] = useState(50000);
  const [workloadType, setWorkloadType] = useState('large_ml_project');
  const [priority, setPriority] = useState('Critical');
  const [trafficProfile, setTrafficProfile] = useState('normal');
  const [scenario, setScenario] = useState('manual');
  const [isInjecting, setIsInjecting] = useState(false);
  const [isSpawning, setIsSpawning] = useState(false);

  const applyScenario = (preset: string) => {
    switch(preset) {
      case 'startup':
        setCompanyName('Startup Inc'); setUserTraffic(500); setWorkloadType('normal_chats'); setTrafficProfile('normal');
        break;
      case 'growing':
        setCompanyName('ScaleUp AI'); setUserTraffic(20000); setWorkloadType('production_saas'); setTrafficProfile('peak');
        break;
      case 'enterprise':
        setCompanyName('Global Enterprise'); setUserTraffic(100000); setWorkloadType('production_saas'); setTrafficProfile('normal');
        break;
      case 'research':
        setCompanyName('AI Research Lab'); setUserTraffic(5000); setWorkloadType('large_ml_project'); setTrafficProfile('deadline');
        break;
    }
  };

  const handleSpawnWorkload = async () => {
    setIsSpawning(true);
    try {
      await createSimulationRun({
        task_type: workloadType,
        user_count: userTraffic,
        allocated_nodes: (Math.floor(userTraffic / 1000) + 1) * (trafficProfile === 'viral' ? 5 : (trafficProfile === 'peak' ? 2 : 1)),
        file_input_size_gb: 50.0,
        image_count: 0,
        thinking_depth: 3,
        complexity_factor: trafficProfile === 'viral' ? 5.0 : (trafficProfile === 'peak' ? 2.0 : 1.0),
        company_name: companyName,
        priority: priority,
        prompt: `Spawned ${workloadType} workload for ${companyName} (${userTraffic} users, Priority: ${priority}, Traffic: ${trafficProfile})`,
        chat_session_id: activeSessionId || undefined,
      });
      onRefreshHistory();
    } catch (e) {
      console.error(e);
      alert('Failed to spawn workload.');
    }
    setIsSpawning(false);
  };

  const handleInjectFailure = async () => {
    setIsInjecting(true);
    try {
      await injectFailure(scenario);
      // Let's also spawn a chat message so the AI can comment on it!
      await createSimulationRun({
        task_type: 'normal_chats',
        user_count: 1,
        allocated_nodes: 1,
        file_input_size_gb: 1.0,
        image_count: 0,
        thinking_depth: 1,
        complexity_factor: 1.0,
        company_name: companyName,
        priority: 'Critical',
        prompt: `[SYSTEM ALERT] Injected disaster scenario: ${scenario}`,
        chat_session_id: activeSessionId || undefined,
      });
      onRefreshHistory();
    } catch (e) {
      console.error(e);
      alert('Failed to inject disaster.');
    }
    setIsInjecting(false);
  };

  return (
    <div className="flex flex-col h-full bg-ws-bg border-r border-border overflow-y-auto w-[400px] flex-shrink-0 hide-scrollbar p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-nord4 flex items-center gap-2">
          <Cpu className="text-ws-interactive w-6 h-6" />
          Simulator Engine
        </h2>
        <p className="text-xs text-nord4/60 mt-1">Configure company profiles, generate workloads, and inject disasters.</p>
      </div>

      {/* Scenario Presets */}
      <div className="bg-ws-surface rounded-lg p-5 border border-border shadow-sm">
        <h3 className="text-sm font-semibold text-nord4 mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-ws-interactive" /> Scenario Engine Presets
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => applyScenario('startup')} className="text-xs p-2 bg-ws-bg border border-border hover:border-ws-interactive rounded text-left">
            <div className="font-bold text-nord4">Startup</div>
            <div className="text-[9px] text-nord4/60 mt-0.5">500 Users · Normal</div>
          </button>
          <button onClick={() => applyScenario('growing')} className="text-xs p-2 bg-ws-bg border border-border hover:border-ws-interactive rounded text-left">
            <div className="font-bold text-nord4">Growing SaaS</div>
            <div className="text-[9px] text-nord4/60 mt-0.5">20k Users · Peak</div>
          </button>
          <button onClick={() => applyScenario('enterprise')} className="text-xs p-2 bg-ws-bg border border-border hover:border-ws-interactive rounded text-left">
            <div className="font-bold text-nord4">Enterprise</div>
            <div className="text-[9px] text-nord4/60 mt-0.5">100k Users · SaaS</div>
          </button>
          <button onClick={() => applyScenario('research')} className="text-xs p-2 bg-ws-bg border border-border hover:border-ws-interactive rounded text-left">
            <div className="font-bold text-nord4">AI Research Lab</div>
            <div className="text-[9px] text-nord4/60 mt-0.5">Heavy GPU Util</div>
          </button>
        </div>
      </div>

      {/* Company Wizard */}
      <div className="bg-ws-surface rounded-lg p-5 border border-border shadow-sm">
        <h3 className="text-sm font-semibold text-nord4 mb-4 flex items-center gap-2">
          <Building className="w-4 h-4 text-nord13" /> Company Profile
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-nord4/70 mb-1">Company Name</label>
            <input 
              type="text" 
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full bg-ws-bg border border-border rounded-md px-3 py-2 text-sm text-nord4 focus:border-ws-interactive outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-nord4/70 mb-1">Workload Scale (Concurrent Jobs)</label>
            <input 
              type="range" 
              min="10" 
              max="1000" 
              step="10"
              value={userTraffic}
              onChange={(e) => setUserTraffic(parseInt(e.target.value))}
              className="w-full accent-ws-interactive"
            />
            <div className="text-right text-xs text-nord14 font-mono mt-1">{userTraffic.toLocaleString()} jobs</div>
          </div>
        </div>
      </div>

      {/* Workload Builder */}
      <div className="bg-ws-surface rounded-lg p-5 border border-border shadow-sm">
        <h3 className="text-sm font-semibold text-nord4 mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-nord12" /> Workload Generator
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-nord4/70 mb-1">Task Type</label>
            <select 
              value={workloadType}
              onChange={(e) => setWorkloadType(e.target.value)}
              className="w-full bg-ws-bg border border-border rounded-md px-3 py-2 text-sm text-nord4 focus:border-ws-interactive outline-none transition-colors"
            >
              <option value="normal_chats">LLM Chat Inference (Low VRAM)</option>
              <option value="large_ml_project">Model Training (High VRAM)</option>
              <option value="video_generation">Video Generation (High Compute)</option>
              <option value="ocr_data_retrieval">OCR Processing (Batch)</option>
              <option value="production_saas">Production SaaS Workload</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono text-nord4/70 mb-1">Traffic Profile</label>
            <select 
              value={trafficProfile}
              onChange={(e) => setTrafficProfile(e.target.value)}
              className="w-full bg-ws-bg border border-border rounded-md px-3 py-2 text-sm text-nord4 focus:border-ws-interactive outline-none transition-colors"
            >
              <option value="normal">Normal Steady Traffic</option>
              <option value="peak">Peak Hours (Morning/Evening)</option>
              <option value="viral">Viral Event (Massive Spike)</option>
              <option value="breaking_news">Breaking News (Explosive Demand)</option>
              <option value="deadline">Research Deadline (Long Running)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono text-nord4/70 mb-1">Priority (SLA)</label>
            <select 
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full bg-ws-bg border border-border rounded-md px-3 py-2 text-sm text-nord4 focus:border-ws-interactive outline-none transition-colors"
            >
              <option value="Critical">Critical (Tier 1)</option>
              <option value="High">High (Tier 2)</option>
              <option value="Normal">Normal (Tier 3)</option>
              <option value="Background">Background (Tier 4)</option>
            </select>
          </div>
          <button 
            onClick={handleSpawnWorkload}
            disabled={isSpawning}
            className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-ws-interactive text-black hover:bg-ws-interactive/90 rounded-md text-sm font-bold transition-all shadow-sm disabled:opacity-50"
          >
            {isSpawning ? 'Spawning...' : 'Spawn Workload'}
          </button>
        </div>
      </div>

      {/* Simulation Clock */}
      <div className="bg-ws-surface rounded-lg p-5 border border-border shadow-sm">
        <h3 className="text-sm font-semibold text-nord4 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-nord15" /> Simulation Clock
        </h3>
        <div className="flex gap-2">
          {['1x', '5x', '10x', '50x'].map((speed) => (
            <button 
              key={speed}
              className={`flex-1 py-1.5 rounded text-xs font-bold transition-colors ${
                speed === '1x' 
                  ? 'bg-ws-interactive text-black' 
                  : 'bg-ws-bg border border-border text-nord4 hover:border-ws-interactive/50'
              }`}
            >
              {speed}
            </button>
          ))}
        </div>
      </div>

      {/* Scenario Builder */}
      <div className="bg-ws-surface rounded-lg p-5 border border-border shadow-sm">
        <h3 className="text-sm font-semibold text-nord4 mb-4 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-nord11" /> Disaster & Failure Injection
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-nord4/70 mb-1">Select Disaster Scenario</label>
            <select 
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              className="w-full bg-ws-bg border border-border rounded-md px-3 py-2 text-sm text-nord4 focus:border-ws-interactive outline-none transition-colors"
            >
              <option value="manual">Normal Operation (No Injection)</option>
              <option value="kill_gpu">Kill GPU (Node Failure)</option>
              <option value="shutdown_node">Shutdown Node (Power Loss)</option>
              <option value="gpu_failure">Overheat GPU (&gt;90°C Thermal Strike)</option>
              <option value="memory_leak">Memory Leak (VRAM Spike)</option>
              <option value="high_latency">High Latency Network Partition</option>
              <option value="kill_ray_worker">Kill Ray Worker</option>
              <option value="delete_pod">Delete Kubernetes Pod</option>
              <option value="peak_traffic">Peak Traffic / API Flood</option>
              <option value="capacity_exhaustion">Simulate Capacity Exhaustion</option>
            </select>
          </div>
          <div className="pt-2">
            <div className="p-3 bg-nord11/10 border border-nord11/30 rounded-lg text-xs text-nord4/80 leading-relaxed min-h-[60px]">
              {scenario === 'manual' && 'Standard operating conditions. Workloads will be scheduled normally.'}
              {scenario === 'kill_gpu' && <><strong className="text-nord11 font-semibold">Warning:</strong> Instantly fails a GPU in the cluster. Watch AI migrate tasks to healthy nodes.</>}
              {scenario === 'shutdown_node' && <><strong className="text-nord11 font-semibold">Warning:</strong> Simulates a sudden node power loss. Telemetry will drop to zero.</>}
              {scenario === 'gpu_failure' && <><strong className="text-nord11 font-semibold">Warning:</strong> Artificially spikes node temperature. ML Isolation Forest should detect and recover.</>}
              {scenario === 'memory_leak' && <><strong className="text-nord11 font-semibold">Warning:</strong> Simulates an unbounded memory leak maxing out VRAM instantly.</>}
              {scenario === 'high_latency' && <><strong className="text-nord11 font-semibold">Warning:</strong> Simulates severe network degradation. Affects Ray actor communication.</>}
              {scenario === 'kill_ray_worker' && <><strong className="text-nord11 font-semibold">Warning:</strong> Instantly kills a worker process, forcing job checkpoint restoration.</>}
              {scenario === 'delete_pod' && <><strong className="text-nord11 font-semibold">Warning:</strong> Evicts a running Kubernetes pod. AI Control Plane must reschedule.</>}
              {scenario === 'peak_traffic' && <><strong className="text-nord11 font-semibold">Warning:</strong> Spawns massive traffic spike causing immediate queue backlogs.</>}
              {scenario === 'capacity_exhaustion' && <><strong className="text-nord11 font-semibold">Warning:</strong> Artificially reserves all available compute to trigger load shedding.</>}
            </div>
          </div>
          <button 
            onClick={handleInjectFailure}
            disabled={isInjecting || scenario === 'manual'}
            className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-ws-bg border border-nord11/50 text-nord11 hover:bg-nord11/10 rounded-md text-sm font-bold transition-all shadow-sm disabled:opacity-50"
          >
            {isInjecting ? 'Injecting...' : 'Execute Failure Event'}
          </button>
        </div>
      </div>
    </div>
  );
}
