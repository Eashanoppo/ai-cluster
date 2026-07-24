'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Loader2, Upload, Cpu, CheckCircle, Flame, AlertTriangle, ArrowRight, Shield, X } from 'lucide-react';
import { runJudgeMode } from '../../actions/simulator';
import { AIThinking } from './AIThinking';
import { AIDecisionPanel } from './AIDecisionPanel';
import { ExecutiveSummary } from './ExecutiveSummary';

interface JudgeModeProps {
  onTimelineEvent?: (event: any) => void;
}

type DemoPhase =
  | 'idle'
  | 'loading'
  | 'job_submitted'
  | 'ai_analyzing'
  | 'ai_decided'
  | 'twin_updated'
  | 'thermal_spike'
  | 'prediction'
  | 'migration_start'
  | 'migration_complete'
  | 'done';

const PHASE_ICONS: Record<string, React.ReactNode> = {
  job_submitted:     <Upload className="w-4 h-4" />,
  ai_analyzing:      <Cpu className="w-4 h-4 animate-spin" />,
  ai_decided:        <CheckCircle className="w-4 h-4" />,
  twin_updated:      <CheckCircle className="w-4 h-4" />,
  thermal_spike:     <Flame className="w-4 h-4" />,
  prediction:        <AlertTriangle className="w-4 h-4" />,
  migration_start:   <ArrowRight className="w-4 h-4" />,
  migration_complete:<Shield className="w-4 h-4" />,
};

function playBeep(freq: number, duration: number, type: 'success' | 'warning' | 'error' = 'success') {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.07, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch { /* AudioContext not available */ }
}

function announceVoice(text: string) {
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.9;
    utt.pitch = 0.8;
    utt.volume = 0.6;
    window.speechSynthesis.speak(utt);
  } catch { /* not available */ }
}

export function JudgeMode({ onTimelineEvent }: JudgeModeProps) {
  const [phase, setPhase] = useState<DemoPhase>('idle');
  const [selectedScenario, setSelectedScenario] = useState<string>('thermal_runaway');
  const [timeline, setTimeline] = useState<any[]>([]);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [schedulingData, setSchedulingData] = useState<any>(null);
  const [showDecisionPanel, setShowDecisionPanel] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [costDelta, setCostDelta] = useState<any>(null);
  const [thermalNode, setThermalNode] = useState('Atlas (Node-012)');
  const [migTarget, setMigTarget] = useState('Orion (Node-034)');
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  const addTimeout = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timeoutsRef.current.push(id);
  };

  const cancel = () => {
    clearAllTimeouts();
    window.speechSynthesis?.cancel();
    setPhase('idle');
    setCompletedSteps([]);
    setShowDecisionPanel(false);
    setShowThinking(false);
    setCountdown(null);
    setShowSummary(false);
  };

  const start = async () => {
    if (phase !== 'idle') return;
    clearAllTimeouts();
    setPhase('loading');
    setCompletedSteps([]);
    setShowDecisionPanel(false);

    try {
      const response = await runJudgeMode(selectedScenario);

      if (!response.ok) {
        console.error('Judge Mode error:', response.error);
        setPhase('idle');
        return;
      }

      const result = response.data;
      const tl: any[] = result.timeline || [];
      setTimeline(tl);
      setSchedulingData(result.scheduling_reasons);
      setCostDelta(result.scheduling_reasons?.cost_delta);
      setThermalNode(`${result.thermal_node_name} (${result.thermal_node})`);
      setMigTarget(`${result.migration_target_name} (${result.migration_target})`);

      // Emit first timeline event
      onTimelineEvent?.({ time: new Date().toLocaleTimeString('en-US', { hour12: false }), label: 'JUDGE MODE', detail: 'Autonomous demo initiated', type: 'info' });

      // Schedule each phase
      tl.forEach((step: any) => {
        addTimeout(() => {
          setPhase(step.event as DemoPhase);
          setCompletedSteps(prev => [...prev, step.event]);
          onTimelineEvent?.({
            time: new Date().toLocaleTimeString('en-US', { hour12: false }),
            label: step.label,
            type: step.event.includes('thermal') || step.event.includes('prediction') ? 'critical'
                : step.event.includes('migration_complete') ? 'success'
                : step.event.includes('migration') ? 'migration'
                : 'info',
          });

          // Phase-specific behaviors
          if (step.event === 'ai_analyzing') {
            setShowThinking(true);
            playBeep(440, 0.3);
          }
          if (step.event === 'ai_decided') {
            setShowThinking(false);
            setShowDecisionPanel(true);
            playBeep(523, 0.3, 'success');
          }
          if (step.event === 'thermal_spike') {
            setShowDecisionPanel(false);
            playBeep(220, 0.8, 'warning');
            announceVoice('Warning. Thermal anomaly detected on node Atlas.');
          }
          if (step.event === 'prediction') {
            playBeep(180, 0.5, 'error');
          }
          if (step.event === 'migration_start') {
            // Countdown 3...2...1
            setCountdown(3);
            addTimeout(() => setCountdown(2), 1000);
            addTimeout(() => setCountdown(1), 2000);
            addTimeout(() => setCountdown(null), 3000);
            announceVoice('Attention. Migration initiated. Countdown. 3. 2. 1.');
          }
          if (step.event === 'migration_complete') {
            setCountdown(null);
            playBeep(660, 0.4, 'success');
            playBeep(880, 0.3, 'success');
            announceVoice('Migration complete. Cluster stable.');
          }
        }, step.delay_ms);
      });

      // Final summary after last step + 2s
      const lastDelay = tl[tl.length - 1]?.delay_ms ?? 17500;
      addTimeout(() => {
        setPhase('done');
        setShowSummary(true);
      }, lastDelay + 2500);

    } catch (err: any) {
      console.error('Judge mode failed:', err);
      setPhase('idle');
    }
  };

  useEffect(() => () => clearAllTimeouts(), []);

  const isDone = phase === 'done';
  const isRunning = phase !== 'idle' && phase !== 'loading' && phase !== 'done';

  const STEPS = [
    { event: 'job_submitted',     label: 'Job Submitted' },
    { event: 'ai_analyzing',      label: 'AI Analyzing' },
    { event: 'ai_decided',        label: 'Decision Made' },
    { event: 'twin_updated',      label: 'Twin Updated' },
    { event: 'thermal_spike',     label: 'Thermal Spike' },
    { event: 'prediction',        label: 'Failure Predicted' },
    { event: 'migration_start',   label: 'Migration' },
    { event: 'migration_complete','label': 'Cluster Stable' },
  ];

  return (
    <>
      {/* Executive Summary Modal */}
      <ExecutiveSummary
        visible={showSummary}
        onClose={() => { setShowSummary(false); setPhase('idle'); }}
        data={costDelta ?? { downtime_prevented_sec: 12, gpu_hours_saved: 18.4, savings_pct: 19, baseline_monthly_usd: 7200, optimized_monthly_usd: 5860, carbon_saved_kg: 18 }}
        clusterHealth={selectedScenario === 'network_partition' ? 84 : selectedScenario === 'traffic_spike' ? 92 : 98}
      />

      <div className="card p-5 space-y-4 border-amber-500/20 bg-amber-500/3">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Judge Mode
            </h2>
            <p className="text-[10px] font-mono text-zinc-500 mt-0.5">Autonomous Demo Scenario</p>
          </div>
          {(isRunning || isDone) && (
            <button onClick={cancel} className="text-zinc-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Launch Button */}
        {phase === 'idle' && (
          <div className="flex flex-col gap-2">
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              className="w-full bg-zinc-900 border border-amber-500/30 text-amber-500 text-xs font-mono p-2 rounded-lg outline-none focus:border-amber-400"
            >
              <option value="thermal_runaway">Scenario: Thermal Runaway</option>
              <option value="traffic_spike">Scenario: Massive Traffic Spike</option>
              <option value="network_partition">Scenario: Network Partition</option>
            </select>
            <button
              id="judge-mode-btn"
              onClick={start}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <Play className="w-4 h-4" />
              Run Selected Scenario
            </button>
          </div>
        )}

        {phase === 'loading' && (
          <div className="flex items-center justify-center gap-2 py-3 text-zinc-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs font-mono">Initializing cluster twin...</span>
          </div>
        )}

        {/* Step Tracker */}
        {(isRunning || isDone) && (
          <div className="space-y-1.5">
            {STEPS.map((s, i) => {
              const isComplete = completedSteps.includes(s.event) && s.event !== phase;
              const isActive = s.event === phase;
              return (
                <div key={s.event} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-300 ${
                  isActive ? 'bg-amber-500/10 border border-amber-500/30'
                  : isComplete ? 'bg-zinc-900/30 border border-zinc-700/30 opacity-60'
                  : 'opacity-25'
                }`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isComplete ? 'bg-emerald-500 text-black' : isActive ? 'bg-amber-500 text-black' : 'bg-zinc-700 text-zinc-500'
                  }`}>
                    {isComplete ? <CheckCircle className="w-3 h-3" /> : (
                      <span className="text-[9px] font-bold">{i + 1}</span>
                    )}
                  </div>
                  <span className={`text-xs font-mono ${isActive ? 'text-amber-300 font-bold' : isComplete ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    {s.label}
                  </span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
                </div>
              );
            })}
          </div>
        )}

        {/* AI Thinking Animation */}
        {showThinking && (
          <div className="px-2">
            <AIThinking onComplete={() => setShowThinking(false)} />
          </div>
        )}

        {/* Thermal Spike Alert */}
        {(phase === 'thermal_spike' || phase === 'prediction') && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 animate-pulse">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4 text-red-400" />
              <span className="text-xs font-bold text-red-300">INCIDENT — Thermal Runaway</span>
            </div>
            <div className="text-xs font-mono text-red-400">{thermalNode} · 91°C · Failure Risk: 91%</div>
            {phase === 'prediction' && (
              <div className="mt-2 text-xs font-mono text-amber-300">
                IsolationForest: Anomaly confirmed. Recommendation: Immediate Migration.
              </div>
            )}
          </div>
        )}

        {/* Migration Countdown */}
        {countdown !== null && (
          <div className="flex flex-col items-center justify-center gap-3 mt-2">
            <div className="w-20 h-20 rounded-full border-4 border-amber-400 flex items-center justify-center animate-pulse">
              <span className="text-4xl font-black text-amber-400">{countdown}</span>
            </div>
            <div className="bg-black/50 border border-zinc-700/50 rounded p-2 text-center">
              <div className="text-[10px] font-mono text-zinc-400">[SYSTEM] Initiating CRIU VRAM checkpoint...</div>
              <div className="text-[10px] font-mono text-zinc-500">Network transfer negotiated at 100Gbps RDMA</div>
            </div>
          </div>
        )}

        {/* AI Decision Panel */}
        {showDecisionPanel && schedulingData && (
          <AIDecisionPanel
            selectedNode={schedulingData.selected_node}
            selectedNodeName={schedulingData.selected_node_name}
            reasons={schedulingData.reasons}
            confidenceBreakdown={schedulingData.confidence_breakdown}
            visible={true}
          />
        )}

        {/* Migration Complete */}
        {phase === 'migration_complete' && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-300">Migration Complete · Zero Downtime</span>
            </div>
            <div className="text-xs font-mono text-emerald-400">{thermalNode} → {migTarget}</div>
            {costDelta && (
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-base font-bold text-white">{costDelta.downtime_prevented_sec}s</div>
                  <div className="text-[9px] font-mono text-zinc-500">Downtime Prevented</div>
                </div>
                <div>
                  <div className="text-base font-bold text-white">{costDelta.gpu_hours_saved}</div>
                  <div className="text-[9px] font-mono text-zinc-500">GPU Hours Saved</div>
                </div>
                <div>
                  <div className="text-base font-bold text-emerald-400">${costDelta.baseline_monthly_usd - costDelta.optimized_monthly_usd}</div>
                  <div className="text-[9px] font-mono text-zinc-500">Savings</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
