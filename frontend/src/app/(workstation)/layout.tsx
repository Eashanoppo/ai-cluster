"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FlaskConical } from "lucide-react";
import NotificationStrip from "../components/workstation/NotificationStrip";
import HeaderNotifications from "../components/ui/HeaderNotifications";
import { cn } from "../../lib/utils";

export default function WorkstationLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col ws-root font-sans">
      {/* Top header — Matched in size, borders, and layout with Dashboard header */}
      <header className="h-16 border-b border-nord3/25 bg-ws-surface flex items-center justify-between px-6 flex-shrink-0 z-30 shadow-sm select-none">
        <div className="flex items-center gap-3">
          <img src="/OnlyLogoNoBG.png" alt="ClustroConnect Logo" className="w-8 h-8 object-contain" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-nord0 tracking-tight">ClustroConnect</span>
            {/* Inline badge — Styled exactly like the Dashboard ACTIVE badge */}
            <div className="hidden sm:flex px-2 py-0.5 border border-ws-interactive/30 bg-ws-interactive/10 text-ws-interactive rounded-full font-mono text-[9px] font-bold items-center gap-1 uppercase">
              <span className="w-1.5 h-1.5 bg-ws-interactive rounded-full animate-pulse"></span>
              Workstation
            </div>
          </div>

          {/* Tab nav — Flat clean buttons matching the active navigation style of the dashboard */}
          <nav className="flex items-center gap-1.5 ml-6">
            <Link
              href="/workstation"
              id="ws-nav-workstation"
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold font-sans transition-all outline-none glow-focus",
                pathname === "/workstation"
                  ? "bg-ws-interactive/15 text-ws-interactive font-bold"
                  : "text-nord2 hover:text-nord0 hover:bg-ws-surface-raised"
              )}
            >
              Workstation
            </Link>
            <Link
              href="/dashboard"
              id="ws-nav-dashboard"
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold font-sans transition-all outline-none glow-focus",
                pathname === "/dashboard"
                  ? "bg-ws-interactive/15 text-ws-interactive font-bold"
                  : "text-nord2 hover:text-nord0 hover:bg-ws-surface-raised"
              )}
            >
              Grafana Analytics
            </Link>
            <Link
              href="/workstation/results"
              id="ws-nav-results"
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold font-sans transition-all outline-none glow-focus",
                pathname === "/workstation/results"
                  ? "bg-ws-interactive/15 text-ws-interactive font-bold"
                  : "text-nord2 hover:text-nord0 hover:bg-ws-surface-raised"
              )}
            >
              Simulation History
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Header notifications dropdown */}
          <HeaderNotifications />

          {/* Dashboard Back Button — Styled to match the CTA buttons in the header */}
          <Link
            href="/"
            id="ws-back-to-dashboard"
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-semibold text-nord1 border border-nord3/30 bg-ws-surface-raised hover:bg-ws-surface hover:text-nord0 hover:border-nord3/50 transition-all rounded-xl shadow-sm outline-none glow-focus"
          >
            ← DASHBOARD
          </Link>
        </div>
      </header>

      {/* Cross-interface notification strip */}
      <NotificationStrip />

      {/* Main content */}
      <main className="flex-1 bg-ws-bg overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
