"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Bell, AlertTriangle, Check, RefreshCw } from "lucide-react";
import { getPendingApprovals } from "../../services/api";

interface NotificationItem {
  id: string;
  type: "overload" | "idle" | "info";
  message: string;
  link: string;
}

export default function HeaderNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      // 1. Fetch pending approvals (overloads requiring human migration approvals)
      const approvals = await getPendingApprovals().catch(() => []);
      const newItems: NotificationItem[] = [];

      if (Array.isArray(approvals)) {
        approvals.forEach((req: any) => {
          if (req.status === "PENDING") {
            const isMigrate = req.action_type === "MIGRATE";
            newItems.push({
              id: `req-${req.id}`,
              type: isMigrate ? "overload" : "info",
              message: req.reason,
              link: "/gate",
            });
          }
        });
      }

      // 2. Fetch latest simulation runs to check for idle fallbacks
      const token = document.cookie.match(/(^| )jwt=([^;]+)/)?.[2] || "";
      const res = await fetch("http://127.0.0.1:8000/api/simulator/runs/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const runs = await res.json();
        const list = Array.isArray(runs) ? runs : runs?.data ?? [];
        
        // Find recent runs in last 120 seconds that had idle fallbacks
        const now = new Date().getTime();
        list.forEach((run: any) => {
          const runTime = new Date(run.created_at).getTime();
          if (now - runTime < 120000) { // 2 minutes
            if (run.verdict_display && run.verdict_display.includes("FALLBACK")) {
              newItems.push({
                id: `run-${run.id}`,
                type: "idle",
                message: `Workload fell back automatically: ${run.verdict_display}`,
                link: "/workstation/results",
              });
            } else if (run.status === "pending") {
              newItems.push({
                id: `run-pending-${run.id}`,
                type: "overload",
                message: `Workload Blocked: Tier ${run.selected_tier} is overloaded. Approve migration!`,
                link: "/gate",
              });
            }
          }
        });
      }

      setNotifications(newItems);
    } catch {
      // Silent
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  // Click outside to close
  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (isOpen && dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, [isOpen]);

  const overloadCount = notifications.filter(n => n.type === "overload").length;
  const idleCount = notifications.filter(n => n.type === "idle").length;

  return (
    <div className="relative font-sans select-none z-40" ref={dropdownRef}>
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1.5 rounded-lg border border-nord3/15 hover:bg-ws-surface-raised transition-colors flex items-center justify-center cursor-pointer outline-none text-nord1 hover:text-nord0"
        title="View Notifications"
      >
        <Bell size={15} />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-ws-interactive text-white font-mono text-[8px] font-black rounded-full flex items-center justify-center animate-pulse">
            {notifications.length}
          </span>
        )}
      </button>

      {/* Floating Indicators in Navbar */}
      {notifications.length > 0 && (
        <div className="hidden lg:flex items-center gap-2 absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none">
          {overloadCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#bf616a]/30 bg-[#bf616a]/10 text-[#bf616a] font-mono text-[8px] font-bold uppercase tracking-wider animate-pulse">
              <AlertTriangle size={8} /> OVERLOAD ALERT
            </span>
          )}
          {idleCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#ebcb8b]/30 bg-[#ebcb8b]/10 text-[#ebcb8b] font-mono text-[8px] font-bold uppercase tracking-wider">
              <RefreshCw size={8} className="animate-spin" /> IDLE FALLBACK
            </span>
          )}
        </div>
      )}

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 bg-ws-surface rounded-xl border border-nord3/15 shadow-lg z-50 p-2 space-y-1 animate-ws-fade-in text-xs">
          <div className="px-2.5 py-1 text-[9px] font-mono font-bold text-nord3 uppercase border-b border-nord3/10 mb-1 flex items-center justify-between">
            <span>Cluster Notifications</span>
            <span className="text-ws-interactive">{notifications.length} active</span>
          </div>

          <div className="max-h-60 overflow-y-auto no-scrollbar space-y-1">
            {notifications.length === 0 ? (
              <div className="py-4 text-center text-nord3 font-mono text-[10px]">
                No active notifications.
              </div>
            ) : (
              notifications.map((item) => (
                <Link
                  key={item.id}
                  href={item.link}
                  onClick={() => setIsOpen(false)}
                  className="block p-2 rounded-lg hover:bg-ws-surface-raised transition-colors border border-transparent hover:border-nord3/10"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5">
                      {item.type === "overload" ? (
                        <AlertTriangle size={13} className="text-[#bf616a]" />
                      ) : item.type === "idle" ? (
                        <RefreshCw size={13} className="text-[#ebcb8b]" />
                      ) : (
                        <Check size={13} className="text-[#a3be8c]" />
                      )}
                    </span>
                    <div className="flex-1 space-y-0.5">
                      <div className="font-semibold text-nord1 leading-relaxed text-[11px]">
                        {item.message}
                      </div>
                      <div className="text-[8px] font-mono text-ws-interactive uppercase tracking-wider">
                        Click to resolve →
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
