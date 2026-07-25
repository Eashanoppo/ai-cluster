'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, AlertTriangle, ShieldCheck, ChevronRight } from 'lucide-react';

export default function CustroCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'system' | 'user' | 'assistant', text: string}[]>([
    { role: 'assistant', text: "Hello! I am CustroCopilot. I am monitoring the cluster telemetry in real-time. How can I help you optimize your datacenter today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const presetQuestions = [
    { label: "Why did AI choose this GPU?", text: "Why did the Kubernator Scheduler assign the latest workload to Node-012?" },
    { label: "Optimize my cluster", text: "Are there any idle GPUs we can suspend to save costs?" },
    { label: "Predict next failure", text: "Based on the Isolation Forest anomaly detection, which node is at highest risk of thermal runaway?" },
    { label: "Summarize today's ROI", text: "How much AWS cloud cost did we save today by packing workloads optimally?" }
  ];

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setIsTyping(true);

    // Mock AI responses based on keywords (since we can't use external OpenAI tokens)
    setTimeout(() => {
      let reply = "I'm analyzing the real-time telemetry from Prometheus and DCGM...";
      
      const lowerText = text.toLowerCase();
      if (lowerText.includes('why') && lowerText.includes('choose')) {
        reply = "I ranked Node-012 as the optimal target because it had a VRAM availability of 22GB (highest in Tier 1) and a stable temperature of 59°C. Other nodes were rejected due to thermal risk scores > 80%.";
      } else if (lowerText.includes('optimize') || lowerText.includes('idle')) {
        reply = "I have identified 14 nodes in Tier 3 that have been idle for over 45 minutes. I recommend suspending these instances, which will save approximately £120/hour in AWS costs. Shall I execute this action via the Kubernetes Control Plane?";
      } else if (lowerText.includes('predict') || lowerText.includes('failure')) {
        reply = "My Scikit-Learn Isolation Forest model indicates that Node-084 is exhibiting abnormal power draw variations (8.4x standard deviation). I predict a 91% probability of thermal throttling within the next 12 minutes. I have preemptively drained this node.";
      } else if (lowerText.includes('roi') || lowerText.includes('cost') || lowerText.includes('save')) {
        reply = "Today, CustroConnect achieved an 89% cluster utilization rate (compared to the 71% legacy baseline). By autonomously live-migrating workloads instead of letting them fail, we prevented 4 hours of downtime and saved £1,300 in wasted compute.";
      }

      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full bg-primary text-black shadow-lg shadow-primary/20 hover:scale-105 transition-transform z-50 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <Bot className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <div className={`fixed bottom-6 right-6 w-96 max-h-[600px] h-[80vh] bg-ws-surface border border-border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-300 transform origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}`}>
        
        {/* Header */}
        <div className="p-4 bg-ws-bg border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">CustroCopilot</h3>
              <p className="text-[10px] text-primary font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                Online & Analyzing
              </p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-950/50">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-xl p-3 text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-zinc-800 text-white border border-zinc-700' 
                  : 'bg-primary/10 text-nord4 border border-primary/20'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 flex gap-1">
                <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Preset Suggestions */}
        {messages.length < 3 && !isTyping && (
          <div className="p-3 border-t border-border/50 bg-ws-surface">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-2">Suggested Queries</p>
            <div className="flex flex-wrap gap-2">
              {presetQuestions.map((q, i) => (
                <button 
                  key={i}
                  onClick={() => handleSend(q.text)}
                  className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 hover:border-primary/50 hover:bg-primary/5 text-xs text-zinc-300 rounded-lg transition-colors text-left flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-primary" />
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-3 border-t border-border bg-ws-bg">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="flex gap-2"
          >
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask CustroCopilot..."
              className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-primary/50 rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isTyping}
              className="p-2 bg-primary text-black rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-colors flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
