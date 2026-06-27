"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Activity, ArrowRightLeft, DollarSign, Lock, LogOut, Cpu, ChevronLeft, ChevronRight } from "lucide-react";
import { logoutAction } from "../../actions/auth";

interface NavItem {
  id: number;
  icon: React.ReactNode;
  label: string;
  href: string;
}

const items: NavItem[] = [
  { id: 0, icon: <LayoutDashboard size={20} />, label: "Overview", href: "/" },
  { id: 1, icon: <Activity size={20} />, label: "Sentinel Alert", href: "/sentinel" },
  { id: 2, icon: <ArrowRightLeft size={20} />, label: "Scheduler", href: "/scheduler" },
  { id: 3, icon: <DollarSign size={20} />, label: "CostWatch", href: "/costwatch" },
  { id: 4, icon: <Lock size={20} />, label: "Execution Gate", href: "/gate" },
];

interface LumaBarProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export default function LumaBar({ isExpanded, onToggle }: LumaBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [active, setActive] = useState(0);

  // Sync active index with current path
  useEffect(() => {
    const activeIndex = items.findIndex((item) => item.href === pathname);
    if (activeIndex !== -1) {
      setActive(activeIndex);
    }
  }, [pathname]);

  const handleNavClick = (index: number, href: string) => {
    setActive(index);
    router.push(href);
  };

  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 z-50">
      <motion.div 
        layout
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className={`relative flex flex-col items-center bg-surface/50 backdrop-blur-2xl py-6 shadow-2xl border border-border overflow-visible transition-all duration-355 ${
          isExpanded ? "w-56 px-4" : "w-16 px-2.5"
        }`}
      >
        {/* Top Header Section */}
        <div className={`flex items-center w-full mb-6 ${isExpanded ? "justify-between px-1" : "justify-center flex-col"}`}>
          {/* Logo / Branding */}
          <div className="w-8 h-8 bg-primary flex items-center justify-center text-black font-bold outline-none shadow-md flex-shrink-0">
            <Cpu size={18} />
          </div>
          
          {isExpanded && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col flex-1 pl-3 overflow-hidden"
            >
              <span className="text-xs font-bold text-white tracking-tight leading-none truncate">NeuronOps_</span>
              <span className="text-[8px] text-zinc-400 font-mono tracking-wider mt-1 uppercase">Smart Layer</span>
            </motion.div>
          )}

          {/* Toggle Button */}
          <button 
            onClick={onToggle}
            className={`text-zinc-400 hover:text-white flex-shrink-0 cursor-pointer outline-none glow-focus p-1 hover:bg-zinc-800/40 rounded transition-colors ${
              !isExpanded ? "mt-4" : ""
            }`}
            title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {/* Menu Items */}
        <div className="flex flex-col gap-3 w-full">
          {items.map((item, index) => {
            const isActive = index === active;
            return (
              <div key={item.id} className="relative flex items-center group w-full">
                
                {/* Active Indicator Glow */}
                {isActive && (
                  <motion.div
                    layoutId="active-indicator"
                    className="absolute inset-0 bg-primary/10 -z-10"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}

                {/* Navigation button */}
                <motion.button
                  onClick={() => handleNavClick(index, item.href)}
                  whileHover={{ scale: 1.05 }}
                  animate={{ scale: isActive ? 1.05 : 1 }}
                  className={`flex items-center gap-3 w-full py-2.5 px-3 transition-colors relative z-10 cursor-pointer outline-none glow-focus ${
                    isActive 
                      ? "text-primary font-bold" 
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <div className="flex-shrink-0">{item.icon}</div>
                  
                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs font-semibold whitespace-nowrap truncate"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </motion.button>

                {/* Hover Tooltip (Boxy Style, Only show when collapsed) */}
                {!isExpanded && (
                  <span className="absolute left-full ml-4 px-2.5 py-1.5 text-xs bg-surface border border-border text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl z-50">
                    {item.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div className="w-full h-[1px] bg-border my-4" />

        {/* Logout form integrated vertically */}
        <form action={logoutAction} className="relative flex items-center group w-full">
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-3 w-full py-2.5 px-3 text-red-400 hover:text-red-300 transition-colors cursor-pointer outline-none glow-focus"
          >
            <div className="flex-shrink-0"><LogOut size={20} /></div>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs font-semibold whitespace-nowrap truncate"
              >
                Logout
              </motion.span>
            )}
          </motion.button>
          
          {/* Tooltip (Only when collapsed) */}
          {!isExpanded && (
            <span className="absolute left-full ml-4 px-2.5 py-1.5 text-xs bg-surface border border-border text-red-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl z-50">
              Logout
            </span>
          )}
        </form>

      </motion.div>
    </div>
  );
}
