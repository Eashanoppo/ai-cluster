"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getPendingApprovals, getCostReports } from "../../services/api";

interface Alert {
  id: string;
  type: "overload" | "idle" | "intervention" | "info";
  message: string;
  timestamp: Date;
}

const TYPE_STYLES: Record<Alert["type"], { dot: string; text: string; bg: string }> = {
  overload: {
    dot: "bg-[#bf616a]",
    text: "text-[#bf616a]",
    bg: "bg-[#bf616a]/10 border-[#bf616a]/30",
  },
  idle: {
    dot: "bg-[#ebcb8b]",
    text: "text-[#ebcb8b]",
    bg: "bg-[#ebcb8b]/10 border-[#ebcb8b]/30",
  },
  intervention: {
    dot: "bg-[#d08770]",
    text: "text-[#d08770]",
    bg: "bg-[#d08770]/10 border-[#d08770]/30",
  },
  info: {
    dot: "bg-[#88c0d0]",
    text: "text-[#88c0d0]",
    bg: "bg-[#88c0d0]/10 border-[#88c0d0]/30",
  },
};

export default function NotificationStrip() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        // Poll dashboard-relevant data for cross-interface alerts using shared API helpers
        const [approvals, costs] = await Promise.all([
          getPendingApprovals(),
          getCostReports(),
        ]);

        const newAlerts: Alert[] = [];

        if (Array.isArray(approvals) && approvals.length > 0) {
          newAlerts.push({
            id: "approvals",
            type: "intervention",
            message: `${approvals.length} pending approval${approvals.length !== 1 ? "s" : ""} require human intervention`,
            timestamp: new Date(),
          });
        }

        if (Array.isArray(costs)) {
          const totalWasted = costs.reduce(
            (acc: number, r: any) => acc + parseFloat(r.wasted_cost_usd ?? "0"),
            0
          );
          if (totalWasted > 50) {
            newAlerts.push({
              id: "idle-cost",
              type: "idle",
              message: `$${totalWasted.toFixed(2)} in idle resource wastage detected on the dashboard`,
              timestamp: new Date(),
            });
          }
        }

        setAlerts(newAlerts);
      } catch {
        // Silent fail — notifications are non-critical
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15_000);
    return () => clearInterval(interval);
  }, []);

  const visible = alerts.filter((a) => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="border-b border-nord3/30 bg-ws-surface px-5 py-2 flex flex-col gap-1.5">
      <div className="flex items-center gap-2 mb-0.5">
        <span className="ws-label-mono text-nord2">DASHBOARD ALERTS</span>
        <Link
          href="/"
          className="ws-label-mono text-ws-interactive hover:underline"
        >
          VIEW DASHBOARD →
        </Link>
      </div>
      {visible.map((alert) => {
        const styles = TYPE_STYLES[alert.type];
        return (
          <div
            key={alert.id}
            className={`flex items-center gap-2.5 px-3 py-1.5 border text-[11px] font-mono ${styles.bg}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${styles.dot}`} />
            <span className={`flex-1 ${styles.text}`}>{alert.message}</span>
            <button
              onClick={() => setDismissed((prev) => new Set([...prev, alert.id]))}
              className="text-nord2 hover:text-nord0 leading-none"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
