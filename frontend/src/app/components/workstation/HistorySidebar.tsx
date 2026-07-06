"use client";

import React, { useMemo } from "react";
import { Calendar, Search, Plus, ChevronLeft, ChevronRight, User } from "lucide-react";
import { cn } from "../../../lib/utils";

export interface ChatSession {
  sessionId: string;
  title: string;
  taskType: string;
  createdAt: Date;
  efficiencyPct?: number;
  verdict?: string;
  runs: any[];
}

interface HistorySidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

// Pure JS Date utilities
const isDateToday = (date: Date) => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

const isDateYesterday = (date: Date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
};

const isWithin30Days = (date: Date) => {
  const limit = new Date();
  limit.setDate(limit.getDate() - 30);
  return date.getTime() > limit.getTime();
};

const formatCustomDate = (date: Date) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const m = months[date.getMonth()];
  const d = date.getDate();
  const hrs = String(date.getHours()).padStart(2, "0");
  const mins = String(date.getMinutes()).padStart(2, "0");
  return `${m} ${d}, ${hrs}:${mins}`;
};

export default function HistorySidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  searchQuery,
  onSearchChange,
  isCollapsed,
  onToggle,
}: HistorySidebarProps) {
  // Filter sessions based on search query
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase();
    return sessions.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.taskType.toLowerCase().includes(q)
    );
  }, [sessions, searchQuery]);

  // Group chronologically
  const groupedSessions = useMemo(() => {
    const groups: {
      today: ChatSession[];
      yesterday: ChatSession[];
      previous30: ChatSession[];
      older: ChatSession[];
    } = {
      today: [],
      yesterday: [],
      previous30: [],
      older: [],
    };

    filteredSessions.forEach((s) => {
      const date = new Date(s.createdAt);
      if (isDateToday(date)) {
        groups.today.push(s);
      } else if (isDateYesterday(date)) {
        groups.yesterday.push(s);
      } else if (isWithin30Days(date)) {
        groups.previous30.push(s);
      } else {
        groups.older.push(s);
      }
    });

    return groups;
  }, [filteredSessions]);

  const renderSessionItem = (s: ChatSession) => {
    const isActive = s.sessionId === activeSessionId;
    const taskIcons: Record<string, string> = {
      ocr_data_retrieval: "📄",
      image_generation: "🎨",
      batch_vision: "🖼️",
      image_editing: "✂️",
      large_ml_project: "🧠",
    };
    const icon = taskIcons[s.taskType] || "💬";

    if (isCollapsed) {
      return (
        <button
          key={s.sessionId}
          onClick={() => onSelectSession(s.sessionId)}
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center transition-all border cursor-pointer group relative mx-auto",
            isActive
              ? "bg-ws-surface-raised border-ws-interactive/30 text-nord0 shadow-sm"
              : "border-transparent text-nord2 hover:bg-ws-surface hover:text-nord1"
          )}
        >
          <span className="text-base flex-shrink-0" role="img" aria-label={s.taskType}>
            {icon}
          </span>
          {/* Floating tooltip */}
          <span className="absolute left-full ml-4 px-2.5 py-1.5 text-xs bg-zinc-950 border border-nord3/30 text-white rounded-lg shadow-md invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none z-50 font-sans font-semibold">
            {s.title || "New Simulation"}
          </span>
        </button>
      );
    }

    return (
      <button
        key={s.sessionId}
        onClick={() => onSelectSession(s.sessionId)}
        className={cn(
          "w-full text-left px-3 py-2.5 rounded-lg flex items-start gap-2.5 transition-all text-xs border cursor-pointer",
          isActive
            ? "bg-ws-surface-raised border-ws-interactive/30 text-nord0 shadow-sm"
            : "border-transparent text-nord2 hover:bg-ws-surface hover:text-nord1"
        )}
      >
        <span className="text-base flex-shrink-0 mt-0.5" role="img" aria-label={s.taskType}>
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate text-[11px]">
            {s.title || "New Simulation Session"}
          </div>
          <div className="flex items-center gap-1.5 mt-1 font-mono text-[9px] text-nord3">
            <span>{formatCustomDate(new Date(s.createdAt))}</span>
            {s.efficiencyPct !== undefined && (
              <>
                <span>·</span>
                <span
                  className={
                    s.verdict === "overload"
                      ? "text-status-overload"
                      : "text-status-optimal font-bold"
                  }
                >
                  {s.efficiencyPct}% Util
                </span>
              </>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div 
      className={cn(
        "border-r border-nord3/20 bg-ws-surface flex flex-col h-full z-20 flex-shrink-0 select-none transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Sidebar Header & Toggle — Height set to h-16 to match layout header */}
      <div className="h-16 border-b border-nord3/10 flex items-center justify-between px-4 flex-shrink-0">
        {!isCollapsed && (
          <span className="font-sans font-bold text-xs tracking-tight text-nord0 uppercase ml-1">
            Chat History
          </span>
        )}
        <button
          onClick={onToggle}
          className={cn(
            "text-nord2 hover:text-nord0 p-1 hover:bg-ws-surface-raised rounded-lg transition-colors cursor-pointer",
            isCollapsed && "mx-auto"
          )}
          title={isCollapsed ? "Expand History" : "Collapse History"}
        >
          {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* New chat & Search controls */}
      <div className="p-3 border-b border-nord3/10 flex flex-col gap-2 flex-shrink-0">
        <button
          onClick={onNewChat}
          className={cn(
            "flex items-center justify-center bg-ws-interactive hover:bg-ws-interactive-hover text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer outline-none glow-focus",
            isCollapsed ? "w-10 h-10 p-0 mx-auto" : "w-full py-2 px-3 gap-2"
          )}
          title="New Simulation"
        >
          <Plus size={14} />
          {!isCollapsed && <span>New Simulation</span>}
        </button>

        {/* Search input — Rounded-xl with matching border and padding */}
        {!isCollapsed && (
          <div className="flex items-center gap-2 bg-ws-surface-raised px-3 py-2 rounded-xl border border-nord3/15">
            <Search size={13} className="text-nord3" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-transparent border-none outline-none text-xs w-full text-nord1 placeholder-nord3"
            />
          </div>
        )}
      </div>

      {/* History items */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4 no-scrollbar">
        {/* Today */}
        {groupedSessions.today.length > 0 && (
          <div className="space-y-1">
            {!isCollapsed && (
              <h3 className="px-2 font-mono text-[9px] font-bold text-nord3 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                Today
              </h3>
            )}
            {groupedSessions.today.map(renderSessionItem)}
          </div>
        )}

        {/* Yesterday */}
        {groupedSessions.yesterday.length > 0 && (
          <div className="space-y-1">
            {!isCollapsed && (
              <h3 className="px-2 font-mono text-[9px] font-bold text-nord3 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                Yesterday
              </h3>
            )}
            {groupedSessions.yesterday.map(renderSessionItem)}
          </div>
        )}

        {/* Previous 30 Days */}
        {groupedSessions.previous30.length > 0 && (
          <div className="space-y-1">
            {!isCollapsed && (
              <h3 className="px-2 font-mono text-[9px] font-bold text-nord3 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                Previous 30 Days
              </h3>
            )}
            {groupedSessions.previous30.map(renderSessionItem)}
          </div>
        )}

        {/* Older */}
        {groupedSessions.older.length > 0 && (
          <div className="space-y-1">
            {!isCollapsed && (
              <h3 className="px-2 font-mono text-[9px] font-bold text-nord3 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                Older
              </h3>
            )}
            {groupedSessions.older.map(renderSessionItem)}
          </div>
        )}

        {sessions.length === 0 && !isCollapsed && (
          <div className="text-center text-nord3 py-8 font-mono text-[10px]">
            No simulation history.
          </div>
        )}
      </div>

      {/* User Card in footer (Unified design system) */}
      <div 
        className={cn(
          "flex items-center gap-2 p-2 rounded-lg border border-nord3/15 bg-ws-surface-raised overflow-hidden flex-shrink-0 mt-auto",
          isCollapsed ? "mx-2 mb-2 justify-center" : "mx-3 mb-3 px-3"
        )}
      >
        <div className="w-8 h-8 rounded-full bg-ws-surface border border-nord3/10 flex items-center justify-center text-nord1 flex-shrink-0">
          <User size={15} />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-nord0 truncate leading-none">admin</span>
            <span className="text-[10px] text-nord2 truncate mt-1">admin@neuronops.io</span>
          </div>
        )}
      </div>
    </div>
  );
}
