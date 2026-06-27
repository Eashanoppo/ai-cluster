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
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Cluster Copilot</h2>
            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Ollama Model Assistant</p>
          </div>
        </div>
        <button 
          onClick={() => setShowConfig(!showConfig)}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Model config panel */}
      {showConfig && (
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">LLM Provider</label>
            <select 
              value={provider} 
              onChange={(e) => setProvider(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:border-gray-400 transition-colors"
            >
              <option value="ollama">Ollama (Local)</option>
              <option value="openrouter">OpenRouter (Cloud)</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Model ID</label>
            <input 
              type="text" 
              value={model} 
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:border-gray-400 transition-colors font-mono"
            />
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none font-medium' 
                  : 'bg-gray-100 text-gray-900 rounded-bl-none font-sans'
              }`}>
                {msg.content}
              </div>
              <span className="text-[9px] text-gray-400 font-mono uppercase tracking-wider mt-1.5">
                {msg.role === 'user' ? 'You' : 'Copilot'}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex flex-col items-start max-w-[85%]">
              <div className="px-4 py-3 bg-gray-100 text-gray-500 rounded-2xl rounded-bl-none text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                <span className="font-mono text-xs uppercase tracking-wider ml-1">Analyzing cluster telemetry...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleChat} className="p-3 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 focus-within:border-gray-400 transition-colors">
          <input 
            type="text" 
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask Copilot about cluster status..."
            className="flex-1 bg-transparent py-1.5 text-sm text-gray-900 focus:outline-none placeholder:text-gray-400"
            disabled={isLoading}
          />
          <button 
            type="submit"
            disabled={isLoading || !chatInput.trim()}
            className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:hover:bg-blue-600 flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
