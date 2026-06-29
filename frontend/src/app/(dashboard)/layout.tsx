'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { History, Sparkles } from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { CopilotChat } from '../components/ui/Copilot';
import Sidebar from '../components/ui/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  return (
    <LayoutGroup>
      <div className="min-h-screen flex bg-background text-white font-sans selection:bg-primary/20 selection:text-primary">
        
        {/* Docked Navigation Sidebar */}
        <Sidebar 
          isCollapsed={!isSidebarExpanded} 
          onToggle={() => setIsSidebarExpanded(!isSidebarExpanded)} 
        />

        {/* Content Wrapper */}
        <motion.div 
          layout
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className={cn(
            "flex-1 flex flex-col min-w-0 h-screen overflow-hidden transition-all duration-300 ease-in-out",
            isSidebarExpanded ? "pl-64" : "pl-16"
          )}
        >
          
          {/* Main Top Header */}
          <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6 z-25 flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-white tracking-tight">NeuronOps</span>
              <div className="hidden sm:flex px-2 py-0.5 border border-primary/20 bg-primary/10 text-primary rounded-full font-mono text-[9px] font-bold items-center gap-1 uppercase">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                Active
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Legacy UI Button */}
              <Link 
                href="/oldfrontend"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-border bg-surface text-zinc-400 hover:bg-surface-hover hover:text-white hover:border-zinc-700 text-sm font-semibold transition-all shadow-sm outline-none glow-focus"
              >
                <History className="w-4 h-4 text-zinc-500" />
                <span className="hidden sm:inline">Legacy Dashboard</span>
              </Link>
            </div>
          </header>
  
          {/* Main Content & Copilot Overlay Area */}
          <div className="flex-1 flex flex-row min-w-0 overflow-hidden bg-background">
            {/* Main Content Area */}
            <motion.main 
              layout
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="flex-1 overflow-y-auto p-6 bg-background relative"
            >
              <div className="w-full h-full">
                {children}
              </div>
            </motion.main>

            {/* Floating Copilot Chat Overlay Popup */}
            <AnimatePresence>
              {isCopilotOpen && (
                <motion.div 
                  initial={{ y: 50, opacity: 0, scale: 0.95 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: 50, opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  className="fixed bottom-6 right-6 w-[420px] h-[580px] z-50 shadow-2xl flex flex-col bg-surface border border-border"
                >
                  <div className="absolute top-[14px] right-12 z-30">
                    <button 
                      onClick={() => setIsCopilotOpen(false)}
                      className="text-xs text-zinc-400 hover:text-white font-mono uppercase tracking-wider cursor-pointer outline-none glow-focus px-2 py-1 border border-border bg-zinc-950 font-bold"
                    >
                      Hide
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <CopilotChat />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

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
            <span>Ask Assistant</span>
          </motion.button>
        )}

      </div>
    </LayoutGroup>
  );
}

// Simple Tailwind helper for class names
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

