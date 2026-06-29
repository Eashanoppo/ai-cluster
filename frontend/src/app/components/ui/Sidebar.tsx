"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Activity, 
  ArrowRightLeft, 
  DollarSign, 
  Lock, 
  LogOut, 
  Cpu, 
  ChevronLeft, 
  ChevronRight,
  Settings,
  HelpCircle,
  User
} from "lucide-react";
import { logoutAction } from "../../actions/auth";
import { cn } from "../../../lib/utils";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

const mainNavItems: NavItem[] = [
  { icon: <LayoutDashboard size={18} />, label: "Dashboard", href: "/" },
  { icon: <Activity size={18} />, label: "Failure Alerts", href: "/sentinel" },
  { icon: <ArrowRightLeft size={18} />, label: "Job Reallocations", href: "/scheduler" },
  { icon: <DollarSign size={18} />, label: "Savings Manager", href: "/costwatch" },
  { icon: <Lock size={18} />, label: "Task Approvals", href: "/gate" },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-card border-r border-border flex flex-col z-40 transition-all duration-300 ease-in-out select-none",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Sidebar Header */}
      <div className="h-16 border-b border-border flex items-center justify-between px-4">
        <div className={cn("flex items-center gap-2.5 overflow-hidden", isCollapsed && "justify-center w-full")}>
          <div className="w-8 h-8 bg-primary flex items-center justify-center text-black font-bold flex-shrink-0">
            <Cpu size={18} />
          </div>
          {!isCollapsed && (
            <span className="font-sans font-bold text-sm tracking-tight text-white truncate">
              NeuronOps
            </span>
          )}
        </div>
        
        {!isCollapsed && (
          <button 
            onClick={onToggle}
            className="text-zinc-500 hover:text-white p-1 hover:bg-zinc-800/40 rounded transition-colors"
            title="Collapse Sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Collapse Trigger for Collapsed State */}
      {isCollapsed && (
        <div className="flex justify-center py-2 border-b border-border">
          <button 
            onClick={onToggle}
            className="text-zinc-500 hover:text-white p-1 hover:bg-zinc-800/40 rounded transition-colors"
            title="Expand Sidebar"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Main Navigation Links */}
      <div className={cn(
        "flex-1 py-4 px-3 space-y-6",
        isCollapsed ? "overflow-visible" : "overflow-y-auto"
      )}>
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
              General
            </div>
          )}
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-all group relative rounded-md",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-zinc-400 hover:text-white hover:bg-zinc-850"
                  )}
                >
                  <div className="flex-shrink-0">{item.icon}</div>
                  {!isCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                  {isCollapsed && (
                    <span className="absolute left-full ml-4 px-2 py-1 text-xs bg-zinc-950 border border-border text-white invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none z-50">
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-border space-y-2">
        {/* Settings button */}
        <Link
          href="/"
          className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-850 rounded-md group relative"
          )}
        >
          <Settings size={18} />
          {!isCollapsed && <span>Settings</span>}
          {isCollapsed && (
            <span className="absolute left-full ml-4 px-2 py-1 text-xs bg-zinc-950 border border-border text-white invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none z-50">
              Settings
            </span>
          )}
        </Link>

        {/* Logout */}
        <form action={logoutAction}>
          <button
            type="submit"
            className={cn(
              "flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-md group relative w-full text-left"
            )}
          >
            <LogOut size={18} />
            {!isCollapsed && <span>Logout</span>}
            {isCollapsed && (
              <span className="absolute left-full ml-4 px-2 py-1 text-xs bg-zinc-950 border border-border text-red-400 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none z-50">
                Logout
              </span>
            )}
          </button>
        </form>

        {/* User Card */}
        <div className={cn(
          "flex items-center gap-2 p-2 rounded-lg border border-border bg-zinc-950/40 overflow-hidden",
          isCollapsed ? "justify-center" : "px-3"
        )}>
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 flex-shrink-0">
            <User size={16} />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white truncate leading-none">admin</span>
              <span className="text-[10px] text-zinc-500 truncate mt-1">admin@neuronops.io</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
