'use client';

import React, { useState } from 'react';
import { Terminal, ArrowRight, Settings } from 'lucide-react';
import { askCopilot } from '../../actions/copilot';

export function CopilotChat() {
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'system', content: 'NeuronOps NL-Copilot active. All systems nominal.' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState('ollama');
  const [model, setModel] = useState('llama3.1:8b');

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isLoading) return;
    
    setMessages(prev => [...prev, { role: 'user', content: chatInput }]);
    const query = chatInput;
    setChatInput('');
    setIsLoading(true);
    
    try {
      const responseMessage = await askCopilot(query, provider, model);
      setMessages(prev => [...prev, { 
        role: 'system', 
        content: responseMessage 
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'system', 
        content: "Error connecting to Copilot API." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card p-5 flex flex-col h-[calc(100vh-8rem)] bg-surface border-border">
      <h2 className="font-mono text-lg font-bold flex items-center justify-between gap-2 mb-4 pb-4 border-b border-border text-text-primary">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-text-primary" />
          NL-Ops Terminal
        </div>
        <div className="flex gap-2 items-center text-xs font-normal">
          <select 
            value={provider} 
            onChange={(e) => setProvider(e.target.value)}
            className="bg-background border border-border px-2 py-1 focus:outline-none"
          >
            <option value="ollama">Ollama</option>
            <option value="openrouter">OpenRouter</option>
          </select>
          <input 
            type="text" 
            value={model} 
            onChange={(e) => setModel(e.target.value)}
            placeholder="Model ID"
            className="bg-background border border-border px-2 py-1 focus:outline-none w-32"
          />
        </div>
      </h2>
      
      <div className="flex-1 overflow-y-auto flex flex-col gap-4 mb-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`p-3 border border-border max-w-[90%] ${
              msg.role === 'user' 
                ? 'bg-primary text-text-primary font-mono text-sm' 
                : 'bg-background text-text-primary font-serif text-base'
            }`}>
              {msg.content}
            </div>
            <span className="text-[10px] text-text-secondary mt-1 font-mono uppercase">
              {msg.role === 'user' ? 'User_Input' : 'Sys_Response'}
            </span>
          </div>
        ))}
        {isLoading && (
          <div className="flex flex-col items-start">
            <div className="p-3 bg-background border border-border text-text-primary font-mono text-sm flex items-center gap-2">
               <span className="w-2 h-2 bg-primary animate-pulse"></span>
              AWAITING_TELEMETRY...
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleChat} className="relative mt-auto border-t border-border pt-4">
        <div className="flex items-center font-mono">
          <ArrowRight className="w-4 h-4 text-text-secondary mr-2" />
          <input 
            type="text" 
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Enter command query..."
            className="w-full bg-background border border-border py-2 px-3 text-sm focus:outline-none focus:border-text-primary focus:ring-1 focus:ring-text-primary transition-colors text-text-primary placeholder:text-text-secondary"
            disabled={isLoading}
          />
          <button 
            type="submit"
            disabled={isLoading}
            className="ml-2 px-4 py-2 bg-text-primary text-background font-bold text-sm uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Execute
          </button>
        </div>
      </form>
    </div>
  );
}
