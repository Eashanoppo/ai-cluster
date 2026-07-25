import React, { useState } from 'react';
import { Building, Target, Server, BrainCircuit, Play } from 'lucide-react';
import { fetchWithAuth } from '../../services/api';

export interface CompanyProfile {
  id?: number;
  name: string;
  industry: string;
  region: string;
  goal_cost: boolean;
  goal_latency: boolean;
  goal_balanced: boolean;
  goal_throughput: boolean;
  initial_gpu_count: number;
  cpu_nodes: number;
  budget: number;
  services: string[];
}

interface CompanyWizardProps {
  onComplete: (profile: CompanyProfile) => void;
}

export default function CompanyWizard({ onComplete }: CompanyWizardProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profile, setProfile] = useState<CompanyProfile>({
    name: 'Default AI Co',
    industry: 'AI Chat Platform',
    region: 'us-east-1',
    goal_cost: false,
    goal_latency: false,
    goal_balanced: true,
    goal_throughput: false,
    initial_gpu_count: 128,
    cpu_nodes: 64,
    budget: 500000,
    services: ['chat', 'coding'],
  });

  const updateProfile = (updates: Partial<CompanyProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  const toggleService = (service: string) => {
    setProfile((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  const setGoal = (goal: 'cost' | 'latency' | 'balanced' | 'throughput') => {
    setProfile((prev) => ({
      ...prev,
      goal_cost: goal === 'cost',
      goal_latency: goal === 'latency',
      goal_balanced: goal === 'balanced',
      goal_throughput: goal === 'throughput',
    }));
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      const data = await fetchWithAuth('/simulator/companies/', {
        method: 'POST',
        body: JSON.stringify(profile),
      });
      onComplete(data);
    } catch (e) {
      console.error(e);
      // Fallback if API fails
      onComplete(profile);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-[#1e222a] border border-[#2e3440] w-full max-w-2xl rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2e3440] bg-[#242933] flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#eceff4] flex items-center gap-2">
              <Building className="w-5 h-5 text-[#88c0d0]" />
              Company Initialization Wizard
            </h2>
            <p className="text-xs text-[#eceff4]/60 mt-1">Configure your virtual AI company to begin simulation.</p>
          </div>
          <div className="text-sm font-mono text-[#eceff4]/50">
            STEP {step} / 5
          </div>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto max-h-[60vh]">
          {/* STEP 1: Details */}
          {step === 1 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg font-semibold text-[#eceff4] flex items-center gap-2 mb-4">
                <Building className="w-4 h-4 text-[#ebcb8b]" /> Company Details
              </h3>
              <div>
                <label className="block text-xs font-mono text-[#eceff4]/70 mb-1">Company Name</label>
                <input 
                  type="text" 
                  value={profile.name}
                  onChange={(e) => updateProfile({ name: e.target.value })}
                  className="w-full bg-[#2e3440] border border-[#3b4252] rounded-md px-3 py-2 text-sm text-[#eceff4] focus:border-[#88c0d0] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-[#eceff4]/70 mb-1">Industry</label>
                <select 
                  value={profile.industry}
                  onChange={(e) => updateProfile({ industry: e.target.value })}
                  className="w-full bg-[#2e3440] border border-[#3b4252] rounded-md px-3 py-2 text-sm text-[#eceff4] focus:border-[#88c0d0] outline-none"
                >
                  <option value="AI Chat Platform">AI Chat Platform</option>
                  <option value="Coding Assistant">Coding Assistant</option>
                  <option value="SaaS Builder">SaaS Builder</option>
                  <option value="Research Company">Research Company</option>
                  <option value="Video AI">Video AI</option>
                  <option value="Medical AI">Medical AI</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-mono text-[#eceff4]/70 mb-1">Region</label>
                <input 
                  type="text" 
                  value={profile.region}
                  onChange={(e) => updateProfile({ region: e.target.value })}
                  className="w-full bg-[#2e3440] border border-[#3b4252] rounded-md px-3 py-2 text-sm text-[#eceff4] focus:border-[#88c0d0] outline-none"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Goals */}
          {step === 2 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg font-semibold text-[#eceff4] flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-[#d08770]" /> Business Goals
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setGoal('cost')}
                  className={`p-4 border rounded-lg text-left transition-colors ${profile.goal_cost ? 'bg-[#88c0d0]/10 border-[#88c0d0]' : 'bg-[#242933] border-[#3b4252] hover:border-[#eceff4]/30'}`}
                >
                  <div className="font-semibold text-[#eceff4] text-sm mb-1">Lowest Cost</div>
                  <div className="text-xs text-[#eceff4]/60">Optimize for budget efficiency. Higher queuing allowed.</div>
                </button>
                <button 
                  onClick={() => setGoal('latency')}
                  className={`p-4 border rounded-lg text-left transition-colors ${profile.goal_latency ? 'bg-[#88c0d0]/10 border-[#88c0d0]' : 'bg-[#242933] border-[#3b4252] hover:border-[#eceff4]/30'}`}
                >
                  <div className="font-semibold text-[#eceff4] text-sm mb-1">Lowest Latency</div>
                  <div className="text-xs text-[#eceff4]/60">Strict SLA requirements. Prioritizes Tier 3/4 hardware.</div>
                </button>
                <button 
                  onClick={() => setGoal('balanced')}
                  className={`p-4 border rounded-lg text-left transition-colors ${profile.goal_balanced ? 'bg-[#88c0d0]/10 border-[#88c0d0]' : 'bg-[#242933] border-[#3b4252] hover:border-[#eceff4]/30'}`}
                >
                  <div className="font-semibold text-[#eceff4] text-sm mb-1">Balanced</div>
                  <div className="text-xs text-[#eceff4]/60">Default trade-off between speed and cost.</div>
                </button>
                <button 
                  onClick={() => setGoal('throughput')}
                  className={`p-4 border rounded-lg text-left transition-colors ${profile.goal_throughput ? 'bg-[#88c0d0]/10 border-[#88c0d0]' : 'bg-[#242933] border-[#3b4252] hover:border-[#eceff4]/30'}`}
                >
                  <div className="font-semibold text-[#eceff4] text-sm mb-1">Maximum Throughput</div>
                  <div className="text-xs text-[#eceff4]/60">Maximize batch processing. Latency is secondary.</div>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Infrastructure */}
          {step === 3 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg font-semibold text-[#eceff4] flex items-center gap-2 mb-4">
                <Server className="w-4 h-4 text-[#a3be8c]" /> Infrastructure Allocation
              </h3>
              <div>
                <label className="block text-xs font-mono text-[#eceff4]/70 mb-1">Initial GPU Count ({profile.initial_gpu_count})</label>
                <input 
                  type="range" 
                  min="8" max="1024" step="8"
                  value={profile.initial_gpu_count}
                  onChange={(e) => updateProfile({ initial_gpu_count: parseInt(e.target.value) })}
                  className="w-full accent-[#88c0d0]"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-[#eceff4]/70 mb-1">CPU Nodes ({profile.cpu_nodes})</label>
                <input 
                  type="range" 
                  min="4" max="512" step="4"
                  value={profile.cpu_nodes}
                  onChange={(e) => updateProfile({ cpu_nodes: parseInt(e.target.value) })}
                  className="w-full accent-[#88c0d0]"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-[#eceff4]/70 mb-1">Monthly Budget (${profile.budget.toLocaleString()})</label>
                <input 
                  type="range" 
                  min="10000" max="5000000" step="10000"
                  value={profile.budget}
                  onChange={(e) => updateProfile({ budget: parseInt(e.target.value) })}
                  className="w-full accent-[#88c0d0]"
                />
              </div>
            </div>
          )}

          {/* STEP 4: AI Services */}
          {step === 4 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg font-semibold text-[#eceff4] flex items-center gap-2 mb-4">
                <BrainCircuit className="w-4 h-4 text-[#b48ead]" /> AI Services
              </h3>
              <p className="text-xs text-[#eceff4]/60 mb-2">Select the AI capabilities your company requires.</p>
              <div className="grid grid-cols-2 gap-2">
                {['chat', 'coding', 'research', 'image', 'video', 'ocr', 'translation', 'agents'].map((srv) => (
                  <label key={srv} className="flex items-center gap-3 p-3 border border-[#3b4252] bg-[#2e3440] rounded-lg cursor-pointer hover:border-[#eceff4]/30">
                    <input 
                      type="checkbox"
                      checked={profile.services.includes(srv)}
                      onChange={() => toggleService(srv)}
                      className="accent-[#88c0d0]"
                    />
                    <span className="text-sm text-[#eceff4] capitalize">{srv}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Simulation */}
          {step === 5 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300 text-center py-6">
              <h3 className="text-2xl font-bold text-[#eceff4] mb-2 flex items-center justify-center gap-2">
                <Play className="w-6 h-6 text-[#a3be8c]" /> Ready to Launch
              </h3>
              <p className="text-sm text-[#eceff4]/60 max-w-md mx-auto">
                Your virtual company "{profile.name}" is fully configured. The Simulator Engine will now generate traffic and telemetry according to your specifications.
              </p>
              
              <div className="bg-[#2e3440] border border-[#3b4252] rounded-lg p-4 mt-6 text-left max-w-md mx-auto">
                <div className="text-xs font-mono text-[#eceff4]/50 mb-1">SUMMARY</div>
                <div className="text-sm text-[#eceff4] flex justify-between border-b border-[#3b4252] py-1">
                  <span>Industry</span> <span className="font-semibold text-[#ebcb8b]">{profile.industry}</span>
                </div>
                <div className="text-sm text-[#eceff4] flex justify-between border-b border-[#3b4252] py-1">
                  <span>Primary Goal</span> 
                  <span className="font-semibold text-[#d08770]">
                    {profile.goal_cost ? 'Cost' : profile.goal_latency ? 'Latency' : profile.goal_balanced ? 'Balanced' : 'Throughput'}
                  </span>
                </div>
                <div className="text-sm text-[#eceff4] flex justify-between py-1">
                  <span>Hardware</span> <span className="font-semibold text-[#a3be8c]">{profile.initial_gpu_count} GPUs</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-[#3b4252] bg-[#242933] flex items-center justify-between">
          <button 
            onClick={() => setStep(step - 1)}
            disabled={step === 1 || isSubmitting}
            className="px-4 py-2 text-sm font-semibold text-[#eceff4]/70 hover:text-[#eceff4] disabled:opacity-30"
          >
            Back
          </button>
          
          {step < 5 ? (
            <button 
              onClick={() => setStep(step + 1)}
              className="px-6 py-2 bg-[#88c0d0] text-black text-sm font-bold rounded-md hover:bg-[#88c0d0]/90 transition-colors"
            >
              Next Step
            </button>
          ) : (
            <button 
              onClick={handleFinish}
              disabled={isSubmitting}
              className="px-8 py-2 bg-[#a3be8c] text-black text-sm font-bold rounded-md hover:bg-[#a3be8c]/90 transition-colors shadow-lg flex items-center gap-2"
            >
              {isSubmitting ? 'Initializing...' : 'Launch Simulation'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
