'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, History } from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { CopilotChat } from '../components/ui/Copilot';
import LumaBar from '../components/ui/futuristic-nav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  return (
    <LayoutGroup>
      <div className="min-h-screen flex bg-background text-white font-sans selection:bg-primary/20 selection:text-primary">
        
        {/* Floating Vertical Navigation Sidebar */}
        <LumaBar isExpanded={isSidebarExpanded} onToggle={() => setIsSidebarExpanded(!isSidebarExpanded)} />

        {/* Content Wrapper */}
        <div className={`flex-1 flex flex-col min-w-0 h-screen overflow-hidden transition-all duration-300 ${
          isSidebarExpanded ? 'pl-68' : 'pl-28'
        }`}>
          
          {/* Main Top Header */}
          <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6 z-25 flex-shrink-0">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white font-sans leading-none tracking-tight">NeuronOps_</h1>
              <div className="hidden sm:flex px-2 py-0.5 border border-primary/20 bg-primary/10 text-primary rounded-full font-mono text-[9px] font-bold items-center gap-1 uppercase">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                Autonomy On
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Legacy UI Button */}
              <Link 
                href="/oldfrontend"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-border bg-surface text-zinc-400 hover:bg-surface-hover hover:text-white hover:border-zinc-700 text-sm font-semibold transition-all shadow-sm outline-none glow-focus"
              >
                <History className="w-4 h-4 text-zinc-500" />
                <span className="hidden sm:inline">Legacy UI</span>
              </Link>
            </div>
          </header>
 
           {/* Main Content & Side-by-Side Integrated Panel */}
          <div className="flex-1 flex flex-row min-w-0 overflow-hidden bg-background">
            {/* Main Content Area */}
            <main className={`flex-1 overflow-y-auto p-6 bg-background relative ${isCopilotOpen ? 'no-scrollbar' : ''}`}>
              <div className="w-full h-full">
                {children}
              </div>
            </main>

            {/* Integrated Sidebar Copilot Panel (Non-overlay) */}
            <AnimatePresence>
              {isCopilotOpen && (
                <motion.aside 
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 384, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                  className="border-l border-border bg-surface flex flex-col flex-shrink-0 h-full relative"
                >
                  <div className="absolute top-[14px] right-4 z-30">
                    <button 
                      onClick={() => setIsCopilotOpen(false)}
                      className="text-xs text-zinc-400 hover:text-white font-mono uppercase tracking-wider cursor-pointer outline-none glow-focus px-3 py-1.5 border border-border bg-zinc-950 font-bold"
                    >
                      [Hide]
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <CopilotChat />
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Floating action button launcher */}
        {!isCopilotOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCopilotOpen(true)}
            className="fixed bottom-6 right-6 z-35 flex items-center gap-2 px-4 py-3 bg-primary text-black rounded-none shadow-lg border border-primary/50 hover:shadow-xl hover:border-primary transition-all cursor-pointer font-sans text-sm font-semibold glow-cta outline-none glow-focus"
          >
            <Sparkles className="w-4.5 h-4.5 text-black" />
            <span>Ask Copilot</span>
          </motion.button>
        )}

      </div>
    </LayoutGroup>
  );
}
