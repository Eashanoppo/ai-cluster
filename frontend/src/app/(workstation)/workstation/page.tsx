"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import HistorySidebar, { ChatSession } from "../../components/workstation/HistorySidebar";
import WorkstationChat from "../../components/workstation/WorkstationChat";
import SimulatorPanel from "../../components/workstation/SimulatorPanel";
import { getSimulationRuns } from "../../services/api";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  timestamp: Date;
  details?: any;
}

export default function WorkstationPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Generate a random unique session ID for a new chat
  const generateNewSessionId = () => {
    return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  };

  // Fetch past simulation runs from backend
  const fetchRuns = useCallback(async () => {
    const hasJwt = typeof document !== 'undefined' && document.cookie.includes('jwt=');
    if (!hasJwt) {
      window.location.href = '/login';
      return;
    }

    try {
      const data = await getSimulationRuns();
      setRuns(data || []);
    } catch (err: any) {
      if (err?.message === "Unauthorized") {
        window.location.href = '/login';
        return;
      }
      console.error("Error fetching simulation runs:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  // Group simulation runs into chronological Chat Sessions
  const sessions = useMemo(() => {
    const sessionMap: Record<string, ChatSession> = {};

    // Group runs
    runs.forEach((run) => {
      const sessionId = run.chat_session_id || `legacy-${run.id}`;
      const runDate = new Date(run.created_at);

      if (!sessionMap[sessionId]) {
        sessionMap[sessionId] = {
          sessionId,
          title: run.prompt || run.task_label || "Simulation",
          taskType: run.task_type,
          createdAt: runDate,
          runs: [],
        };
      }

      sessionMap[sessionId].runs.push(run);

      // Set date to earliest run's date
      if (runDate < sessionMap[sessionId].createdAt) {
        sessionMap[sessionId].createdAt = runDate;
      }
    });

    // Compute session details (efficiency, latest status)
    const sessionList = Object.values(sessionMap).map((session) => {
      // Sort runs inside session chronologically
      session.runs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      // Update session title using the first prompt
      const firstPrompt = session.runs[0]?.prompt;
      if (firstPrompt) {
        session.title = firstPrompt.length > 55 ? `${firstPrompt.substring(0, 55)}...` : firstPrompt;
      }

      const latestRun = session.runs[session.runs.length - 1];
      return {
        ...session,
        efficiencyPct: latestRun?.efficiency_pct,
        verdict: latestRun?.verdict,
      };
    });

    // Sort sessions descending by date (most recent first)
    return sessionList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [runs]);

  // Set initial active session ID if none selected
  useEffect(() => {
    if (!activeSessionId && sessions.length > 0) {
      setActiveSessionId(sessions[0].sessionId);
    } else if (!activeSessionId && !isLoading) {
      setActiveSessionId(generateNewSessionId());
    }
  }, [sessions, activeSessionId, isLoading]);

  // Messages flow for active chat session
  const activeSessionMessages = useMemo(() => {
    const list: Message[] = [];
    
    // Add default assistant introduction
    list.push({
      id: "welcome-msg",
      role: "assistant",
      text: "Hello! I am your AI Assistant. I can help you analyze system status, forecast potential issues, and optimize task placements. Ask me anything!",
      timestamp: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
    });

    if (!activeSessionId) return list;

    const session = sessions.find((s) => s.sessionId === activeSessionId);
    if (session) {
      session.runs.forEach((run) => {
        const runTime = new Date(run.created_at);
        // User message
        list.push({
          id: `user-${run.id}`,
          role: "user",
          text: run.prompt || `Run ${run.task_label || run.task_type} simulation`,
          timestamp: runTime,
        });

        // Assistant response
        if (run.status === "completed") {
          list.push({
            id: `assistant-${run.id}`,
            role: "assistant",
            text: run.response_text || `Analysis completed successfully. System efficiency assessed at ${run.efficiency_pct}%.`,
            timestamp: new Date(runTime.getTime() + 2000), // offset by 2s
            details: run,
          });
        } else if (run.status === "failed") {
          list.push({
            id: `assistant-failed-${run.id}`,
            role: "system",
            text: `Simulation failed during execution.`,
            timestamp: new Date(runTime.getTime() + 1000),
          });
        } else if (run.status === "pending") {
          list.push({
            id: `assistant-pending-${run.id}`,
            role: "system",
            text: `Simulation pending human approval in Execution Gate due to cluster overload: ${run.response_text || 'Requires intervention.'}`,
            timestamp: new Date(runTime.getTime() + 1000),
          });
        } else {
          list.push({
            id: `assistant-running-${run.id}`,
            role: "system",
            text: `Analyzing workload and executing simulation...`,
            timestamp: new Date(runTime.getTime() + 1000),
          });
        }
      });
    }

    return list;
  }, [activeSessionId, sessions]);

  const handleAddMessage = (msg: Message) => {
    // Handled by backend update and refetch runs, but let's update client state directly to show immediate response
    if (msg.role === "user") {
      // Create a mock run object to render immediately
      const tempRun = {
        id: Math.random(),
        chat_session_id: activeSessionId,
        prompt: msg.text,
        task_type: "ocr_data_retrieval",
        created_at: new Date().toISOString(),
        status: "processing",
      };
      setRuns((prev) => [...prev, tempRun]);
    } else {
      // Append completed details
      setRuns((prev) => {
        const filtered = prev.filter((r) => r.chat_session_id !== activeSessionId || r.status !== "processing");
        if (msg.details) {
          return [...filtered, msg.details];
        }
        return filtered;
      });
    }
  };

  const handleNewChat = () => {
    setActiveSessionId(generateNewSessionId());
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-3.5rem)] w-full flex flex-col items-center justify-center bg-ws-bg text-nord2 space-y-4 font-sans select-none">
        <div className="w-12 h-12 border-4 border-ws-interactive border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-mono font-bold uppercase tracking-wider text-nord2 animate-pulse">
          Establishing uplink to cluster workstation...
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full overflow-hidden">
      {/* Sidebar: Grouped chronology history list */}
      <HistorySidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewChat={handleNewChat}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Simulator Control Panel */}
      <SimulatorPanel 
        onRefreshHistory={fetchRuns}
        activeSessionId={activeSessionId}
      />

      {/* Main chat workstation workspace */}
      {activeSessionId && (
        <WorkstationChat
          activeSessionId={activeSessionId}
          messages={activeSessionMessages}
          onAddMessage={handleAddMessage}
          onRefreshHistory={fetchRuns}
        />
      )}
    </div>
  );
}
