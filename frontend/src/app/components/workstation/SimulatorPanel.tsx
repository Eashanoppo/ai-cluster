import React, { useState } from 'react';
import { Play, ShieldAlert, Cpu, Users, Building, Zap } from 'lucide-react';
import { createSimulationRun, injectFailure } from '../../services/api';

interface SimulatorPanelProps {
  onRefreshHistory: () => void;
  activeSessionId: string | null;
}

export default function SimulatorPanel({ onRefreshHistory, activeSessionId }: SimulatorPanelProps) {
  const [companyName, setCompanyName] = useState('OpenAI');
  const [userTraffic, setUserTraffic] = useState(50000);
  const [workloadType, setWorkloadType] = useState('model_training');
  const [priority, setPriority] = useState('Critical');
  const [scenario, setScenario] = useState('manual');
  const [isInjecting, setIsInjecting] = useState(false);
  const [isSpawning, setIsSpawning] = useState(false);

  const handleSpawnWorkload = async () => {
    setIsSpawning(true);
    try {
      await createSimulationRun({
        task_type: workloadType,
        user_count: userTraffic,
        allocated_nodes: Math.floor(userTraffic / 1000) + 1, // rough estimate
        file_input_size_gb: 50.0,
        image_count: 0,
        thinking_depth: 3,
        complexity_factor: 2.0,
        company_name: companyName,
        priority: priority,
        prompt: `Spawned ${workloadType} workload for ${companyName} (${userTraffic} users, Priority: ${priority})`,
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
            <label className="block text-xs font-mono text-nord4/70 mb-1">Simulated User Traffic</label>
            <input 
              type="range" 
              min="1000" 
              max="100000" 
              step="1000"
              value={userTraffic}
              onChange={(e) => setUserTraffic(parseInt(e.target.value))}
              className="w-full accent-ws-interactive"
            />
            <div className="text-right text-xs text-nord14 font-mono mt-1">{userTraffic.toLocaleString()} users</div>
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

      {/* Scenario Builder */}
      <div className="bg-ws-surface rounded-lg p-5 border border-border shadow-sm">
        <h3 className="text-sm font-semibold text-nord4 mb-4 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-nord11" /> Scenario Injection
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-nord4/70 mb-1">Disaster Scenario</label>
            <select 
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              className="w-full bg-ws-bg border border-border rounded-md px-3 py-2 text-sm text-nord4 focus:border-ws-interactive outline-none transition-colors"
            >
              <option value="manual">Manual (Normal Operation)</option>
              <option value="peak_traffic">Sudden Peak Traffic (10x Spike)</option>
              <option value="gpu_failure">Inject GPU Thermal Failure (&gt;90°C)</option>
              <option value="capacity_exhaustion">Simulate Capacity Exhaustion</option>
            </select>
          </div>
          <div className="pt-2">
            <div className="p-3 bg-nord11/10 border border-nord11/30 rounded-lg text-xs text-nord4/80 leading-relaxed">
              {scenario === 'gpu_failure' && <><strong className="text-nord11 font-semibold">Warning:</strong> This will artificially spike a node's temperature. The ML Isolation Forest should detect it and trigger a Live Migration.</>}
              {scenario === 'peak_traffic' && <><strong className="text-nord11 font-semibold">Warning:</strong> This will spawn hundreds of pending workloads. Watch the AI wake up sleeping nodes.</>}
              {scenario === 'manual' && 'Standard operating conditions. Workloads will be scheduled according to SLA.'}
              {scenario === 'capacity_exhaustion' && <><strong className="text-nord11 font-semibold">Warning:</strong> Will exhaust all capacity to trigger load shedding.</>}
            </div>
          </div>
          <button 
            onClick={handleInjectFailure}
            disabled={isInjecting || scenario === 'manual'}
            className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-ws-bg border border-nord11/50 text-nord11 hover:bg-nord11/10 rounded-md text-sm font-bold transition-all shadow-sm disabled:opacity-50"
          >
            {isInjecting ? 'Injecting...' : 'Inject Disaster'}
          </button>
        </div>
      </div>
    </div>
  );
}
