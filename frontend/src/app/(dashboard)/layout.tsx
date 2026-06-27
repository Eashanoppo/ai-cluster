'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Activity, 
  ArrowRightLeft, 
  DollarSign, 
  Lock, 
  ChevronLeft, 
  ChevronRight, 
  Cpu, 
  History, 
  LogOut,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { CopilotChat } from '../components/ui/Copilot';
import { logoutAction } from '../actions/auth';

const NAV_ITEMS = [
  { label: 'Overview', href: '/', icon: LayoutDashboard },
  { label: 'Sentinel Alert', href: '/sentinel', icon: Activity },
  { label: 'Scheduler', href: '/scheduler', icon: ArrowRightLeft },
  { label: 'CostWatch', href: '/costwatch', icon: DollarSign },
  { label: 'Execution Gate', href: '/gate', icon: Lock },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  return (
    <LayoutGroup>
      <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-700">
        
        {/* Left Sidebar Navigation */}
        <motion.aside 
          layout="position"
          className={`flex flex-col border-r border-gray-200 bg-white h-screen sticky top-0 z-30 transition-all duration-300 overflow-x-hidden no-scrollbar ${
            isSidebarCollapsed ? 'w-16' : 'w-60'
          }`}
        >
          {/* Logo / Header (Toggle at Top) */}
          {!isSidebarCollapsed ? (
            <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4 overflow-hidden flex-shrink-0">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white flex-shrink-0">
                  <Cpu className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900 tracking-tight leading-none">NeuronOps_</span>
                  <span className="text-[9px] text-gray-400 font-mono tracking-wider mt-1 uppercase">Smart Layer</span>
                </div>
              </div>
              <button 
                onClick={() => setIsSidebarCollapsed(true)}
                className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                title="Collapse Sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="py-2.5 border-b border-gray-200 flex flex-col items-center gap-2 flex-shrink-0 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white flex-shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
              <button 
                onClick={() => setIsSidebarCollapsed(false)}
                className="p-1 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                title="Expand Sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Nav Items */}
          <nav className="flex-1 px-2 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden no-scrollbar">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  className="block"
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  <span className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                    isActive 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}>
                    <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    {!isSidebarCollapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="truncate"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </span>
                </Link>
              );
            })}

          </nav>

          {/* Sidebar footer logout */}
          <div className="p-2 border-t border-gray-200">
            {/* Logout button */}
            <form action={logoutAction}>
              <button 
                type="submit"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors group relative"
                title={isSidebarCollapsed ? "Logout" : undefined}
              >
                <LogOut className="w-5 h-5 flex-shrink-0 text-red-400 group-hover:text-red-50" />
                {!isSidebarCollapsed && <span className="truncate">Logout</span>}
              </button>
            </form>
          </div>
        </motion.aside>

        {/* Content Wrapper */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          
          {/* Main Top Header */}
          <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 z-25 flex-shrink-0">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900 font-sans leading-none tracking-tight">NeuronOps_</h1>
              <div className="hidden sm:flex px-2 py-0.5 border border-blue-200 bg-blue-50 text-blue-600 rounded-full font-mono text-[9px] font-bold items-center gap-1 uppercase">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                Autonomy On
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Legacy UI Button */}
              <Link 
                href="/oldfrontend"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-gray-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-gray-300 text-sm font-semibold transition-all shadow-sm"
              >
                <History className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">Legacy UI</span>
              </Link>
            </div>
          </header>
 
          {/* Main Content Area - full width, no artificial max-w constraint */}
          <main className="flex-1 overflow-y-auto p-6 relative">
            <div className="w-full h-full">
              {children}
            </div>
          </main>
        </div>
 
        {/* Floating Copilot slide-out Drawer */}
        <AnimatePresence>
          {isCopilotOpen && (
            <>
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCopilotOpen(false)}
                className="fixed inset-0 bg-gray-900 z-40"
              />
              {/* Drawer Sheet */}
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-white z-50 border-l-4 border-l-blue-600 shadow-2xl p-4 flex flex-col"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-400 font-mono uppercase tracking-wider">AI Operations Assistant</span>
                  <button 
                    onClick={() => setIsCopilotOpen(false)}
                    className="text-xs text-gray-400 hover:text-gray-600 font-mono"
                  >
                    [Close]
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <CopilotChat />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Floating action button launcher */}
        {!isCopilotOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCopilotOpen(true)}
            className="fixed bottom-6 right-6 z-35 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-sky-500 text-white rounded-full shadow-lg border border-blue-400 hover:shadow-xl hover:border-blue-300 transition-all cursor-pointer font-sans text-sm font-semibold"
          >
            <Sparkles className="w-4.5 h-4.5 animate-pulse text-white" />
            <span>Ask Copilot</span>
          </motion.button>
        )}

      </div>
    </LayoutGroup>
  );
}
