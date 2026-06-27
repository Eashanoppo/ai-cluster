'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Send, Settings, Sparkles } from 'lucide-react';
import { askCopilot } from '../../actions/copilot';
import { usePathname } from 'next/navigation';
import { pollLatestTelemetry } from '../../actions/telemetry';
import { pollPredictions } from '../../actions/sentinel';

export function CopilotChat() {
  const pathname = usePathname();
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'system', content: 'Hello! I am your NeuronOps AI Copilot. I can help you analyze cluster telemetry, predict node failures, and optimize scheduler decisions. Ask me anything!' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState('ollama');
  const [model, setModel] = useState('llama3.1:8b');
  const [showConfig, setShowConfig] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const getRouteContext = async () => {
    let contextStr = '';
    try {
      if (pathname === '/sentinel') {
        const predictions = await pollPredictions().catch(() => []);
        if (predictions.length > 0) {
          const top = predictions[0];
          contextStr = `[Active Page: Sentinel (Observability). Latest failure prediction: Node ${top.node_id} has a ${Math.round(top.failure_probability * 100)}% failure probability due to: ${top.reason || 'none'}.] `;
        } else {
          contextStr = `[Active Page: Sentinel (Observability). No failure predictions active.] `;
        }
      } else if (pathname === '/costwatch') {
        contextStr = `[Active Page: CostWatch (Efficiency). Focus on identified idle node VRAM/power waste and local LLM redirection.] `;
      } else if (pathname === '/scheduler') {
        contextStr = `[Active Page: Scheduler. Focus on active workload placements, migrations, and routing jobs from hot nodes to cool nodes.] `;
      } else if (pathname === '/gate') {
        contextStr = `[Active Page: Execution Gate. Focus on pending approval actions like node migrations or process termination approvals.] `;
      } else {
        const latest = await pollLatestTelemetry().catch(() => []);
        if (latest.length > 0) {
          const stats = latest.map(n => `${n.node_id}: Temp=${n.temperature_celsius}°C, Util=${n.gpu_utilization_percent}%`).join(', ');
          contextStr = `[Active Page: Overview Dashboard. Current cluster status: ${stats}.] `;
        } else {
          contextStr = `[Active Page: Overview Dashboard. Telemetry sync pending.] `;
        }
      }
    } catch (e) {
      contextStr = `[Active Page Context: Route=${pathname}. Data fetch error.] `;
    }
    return contextStr;
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isLoading) return;

    const userMessage = chatInput;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');
    setIsLoading(true);

    // Fetch live page-specific context
    const routeContext = await getRouteContext();
    const fullQuery = `${routeContext}User Query: ${userMessage}`;

    try {
      const responseMessage = await askCopilot(fullQuery, provider, model);
      setMessages(prev => [...prev, { role: 'system', content: responseMessage }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'system', content: "Error connecting to Copilot API." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface border border-border overflow-hidden shadow-2xl font-sans rounded-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-none bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Cluster Copilot</h2>
            <p className="text-mono-label text-zinc-400 mt-0.5">Ollama Model Assistant</p>
          </div>
        </div>
        <button 
          onClick={() => setShowConfig(!showConfig)}
          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/40 rounded-none transition-colors outline-none glow-focus cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Model config panel */}
      {showConfig && (
        <div className="px-4 py-3 bg-zinc-900 border-b border-border grid grid-cols-2 gap-2 text-xs text-zinc-350">
          <div>
            <label className="block text-mono-label text-zinc-400 mb-1">LLM Provider</label>
            <select 
              value={provider} 
              onChange={(e) => setProvider(e.target.value)}
              className="w-full bg-surface border border-border text-white rounded-none px-2 py-1.5 focus:outline-none focus:border-primary transition-colors cursor-pointer"
            >
              <option value="ollama">Ollama (Local)</option>
              <option value="openrouter">OpenRouter (Cloud)</option>
            </select>
          </div>
          <div>
            <label className="block text-mono-label text-zinc-400 mb-1">Model ID</label>
            <input 
              type="text" 
              value={model} 
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-surface border border-border text-white rounded-none px-2 py-1.5 focus:outline-none focus:border-primary transition-colors font-mono"
            />
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-4 py-3 rounded-none text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-primary text-black font-semibold shadow-md shadow-primary/10' 
                  : 'bg-zinc-950 border border-border text-zinc-200'
              }`}>
                {msg.content}
              </div>
              <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider mt-1.5">
                {msg.role === 'user' ? 'You' : 'Copilot'}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex flex-col items-start max-w-[85%]">
              <div className="px-4 py-3 bg-zinc-950 border border-border text-zinc-400 rounded-none text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                <span className="font-mono text-[10px] uppercase tracking-wider ml-1">Analyzing cluster telemetry...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleChat} className="p-3 border-t border-border bg-surface">
        <div className="flex items-center gap-2 bg-zinc-900 border border-border rounded-none px-3 py-1.5 focus-within:border-primary transition-colors">
          <input 
            type="text" 
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask Copilot about cluster status..."
            className="flex-1 bg-transparent py-1.5 text-sm text-white focus:outline-none placeholder:text-zinc-500"
            disabled={isLoading}
          />
          <button 
            type="submit"
            disabled={isLoading || !chatInput.trim()}
            className="p-1.5 bg-primary text-black hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:hover:bg-primary flex items-center justify-center rounded-none outline-none glow-focus cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
